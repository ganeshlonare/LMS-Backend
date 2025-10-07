import { razorPay } from "../server.js";
import dotenv from 'dotenv';
import crypto from 'crypto';
import { errorhandler } from "../utils/errorHandler.js";
import User from "../models/user.model.js";
import Payment from "../models/payment.model.js";
import { validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';

dotenv.config();

// Rate limiting for payment endpoints
export const paymentLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 requests per windowMs
    message: 'Too many payment attempts from this IP, please try again after 15 minutes'
});
/**
 * @route GET /api/v1/payment/get-key
 * @description Get Razorpay API key
 * @access Private
 */
export const getRazorpayKey = async (req, res, next) => {
    try {
        if (!process.env.RAZORPAY_KEY_ID) {
            return next(errorhandler(500, 'Razorpay key not configured'));
        }
        
        res.status(200).json({
            success: true,
            message: "RazorPay API key fetched successfully",
            key: process.env.RAZORPAY_KEY_ID
        });
    } catch (error) {
        console.error('Error in getRazorpayKey:', error);
        return next(errorhandler(500, 'Failed to fetch Razorpay key'));
    }
};
/**
 * @route POST /api/v1/payment/subscribe
 * @description Create a new subscription
 * @access Private
 */
export const BuySubscription = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        // Input validation
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return next(errorhandler(400, { errors: errors.array() }));
        }

        const { id } = req.user;
        
        // Find user in transaction
        const user = await User.findById(id).session(session);
        if (!user) {
            await session.abortTransaction();
            return next(errorhandler(404, 'User not found'));
        }

        // Role check
        if (user.role === 'ADMIN') {
            await session.abortTransaction();
            return next(errorhandler(403, 'Admins cannot purchase subscriptions'));
        }

        // Check if user already has an active subscription
        if (user.subscription?.status === 'active') {
            await session.abortTransaction();
            return next(errorhandler(400, 'User already has an active subscription'));
        }

        // Create subscription with Razorpay
        const subscription = await razorPay.subscriptions.create({
            plan_id: process.env.RAZORPAY_PLAN_ID,
            customer_notify: 1,
            total_count: 12,
            notes: {
                userId: user._id.toString(),
                userEmail: user.email
            }
        });

        // Update user subscription details
        user.subscription = {
            id: subscription.id,
            status: subscription.status,
            startDate: new Date(),
            endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)) // 1 year from now
        };

        await user.save({ session });
        await session.commitTransaction();
        
        res.status(200).json({
            success: true,
            message: 'Subscription created successfully',
            subscription_id: subscription.id
        });


    }catch (error) {
        await session.abortTransaction();
        console.error('Error in BuySubscription:', error);
        
        // Handle specific Razorpay errors
        if (error.error?.description) {
            return next(errorhandler(error.statusCode || 400, error.error.description));
        }
        
        return next(errorhandler(500, 'Failed to create subscription. Please try again later.'));
    } finally {
        session.endSession();
    }
};
/**
 * @route POST /api/v1/payment/verify
 * @description Verify payment and activate subscription
 * @access Private
 */
export const verifySubscription = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Input validation
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return next(errorhandler(400, { errors: errors.array() }));
        }

        const { id } = req.user;
        const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = req.body;

        // Basic input validation
        if (!razorpay_payment_id || !razorpay_signature || !razorpay_subscription_id) {
            await session.abortTransaction();
            return next(errorhandler(400, 'Missing required payment verification details'));
        }

        // Find user in transaction
        const user = await User.findById(id).session(session);
        if (!user) {
            await session.abortTransaction();
            return next(errorhandler(404, 'User not found'));
        }

        // Verify subscription exists for user
        if (!user.subscription?.id) {
            await session.abortTransaction();
            return next(errorhandler(400, 'No subscription found for this user'));
        }

        // Verify the payment signature
        const generatedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_SECRET)
            .update(`${razorpay_payment_id}|${user.subscription.id}`)
            .digest('hex');

        // Secure comparison to prevent timing attacks
        const signatureValid = crypto.timingSafeEqual(
            Buffer.from(razorpay_signature, 'utf8'),
            Buffer.from(generatedSignature, 'utf8')
        );

        if (!signatureValid) {
            // Log failed verification attempt for security monitoring
            console.warn(`Payment verification failed for user ${id}. Possible tampering detected.`);
            await session.abortTransaction();
            return next(errorhandler(400, 'Payment verification failed. Please try again or contact support.'));
        }

        // Verify subscription with Razorpay
        const subscription = await razorPay.subscriptions.fetch(user.subscription.id);
        
        if (subscription.status !== 'active') {
            await session.abortTransaction();
            return next(errorhandler(400, 'Subscription is not active'));
        }

        // Create payment record
        const payment = new Payment({
            user: user._id,
            razorpay_payment_id,
            razorpay_subscription_id: user.subscription.id,
            razorpay_signature,
            amount: subscription.plan.amount / 100, // Convert to base unit (e.g., paise to rupees)
            currency: subscription.plan.currency,
            status: 'completed'
        });

        await payment.save({ session });

        // Update user subscription
        user.subscription.status = 'active';
        user.subscription.activatedAt = new Date();
        user.subscription.paymentId = payment._id;
        
        await user.save({ session });
        await session.commitTransaction();

        // TODO: Send confirmation email or notification

        return res.status(200).json({
            success: true,
            message: 'Payment verified and subscription activated successfully',
            subscription: {
                status: user.subscription.status,
                startDate: user.subscription.startDate,
                endDate: user.subscription.endDate
            }
        });

    } catch (error) {
        await session.abortTransaction();
        console.error('Error in verifySubscription:', error);
        
        // Handle specific Razorpay errors
        if (error.error?.description) {
            return next(errorhandler(error.statusCode || 400, error.error.description));
        }
        
        return next(errorhandler(500, 'Failed to verify payment. Please contact support.'));
    } finally {
        session.endSession();
    }
};
/**
 * @route DELETE /api/v1/payment/subscription
 * @description Cancel a subscription and process refund if applicable
 * @access Private
 */
export const cancelSubscription = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { id } = req.user;

        // Find user in transaction
        const user = await User.findById(id).session(session);
        if (!user) {
            await session.abortTransaction();
            return next(errorhandler(404, 'User not found'));
        }

        // Check if user is admin
        if (user.role === 'ADMIN') {
            await session.abortTransaction();
            return next(errorhandler(403, 'Admins cannot cancel subscriptions through this endpoint'));
        }

        // Check if user has an active subscription
        if (!user.subscription?.id) {
            await session.abortTransaction();
            return next(errorhandler(400, 'No active subscription found'));
        }

        const subscriptionId = user.subscription.id;

        // Check if subscription is already cancelled
        if (user.subscription.status === 'cancelled') {
            await session.abortTransaction();
            return next(errorhandler(400, 'Subscription is already cancelled'));
        }

        // Cancel subscription with Razorpay
        const subscription = await razorPay.subscriptions.cancel(subscriptionId);
        
        // Find the latest payment for this subscription
        const payment = await Payment.findOne({
            razorpay_subscription_id: subscriptionId,
            status: 'completed'
        }).sort({ createdAt: -1 }).session(session);

        // Process refund if within refund period (14 days)
        if (payment && payment.createdAt) {
            const timeSubscribed = Date.now() - payment.createdAt.getTime();
            const refundPeriod = 14 * 24 * 60 * 60 * 1000; // 14 days in milliseconds
            
            if (timeSubscribed <= refundPeriod) {
                try {
                    await razorPay.payments.refund(payment.razorpay_payment_id, {
                        speed: 'optimum',
                        notes: {
                            reason: 'Subscription cancelled within refund period',
                            cancelledBy: user._id.toString()
                        }
                    });
                    
                    // Update payment status to refunded
                    payment.status = 'refunded';
                    payment.refundedAt = new Date();
                    await payment.save({ session });
                } catch (refundError) {
                    console.error('Error processing refund:', refundError);
                    // Continue with cancellation even if refund fails
                }
            }
        }

        // Update user subscription status
        user.subscription.status = 'cancelled';
        user.subscription.cancelledAt = new Date();
        
        // Optionally, keep subscription data for records
        // user.subscription.endedAt = new Date();
        // user.subscription.cancellationReason = req.body.reason || 'User requested cancellation';
        
        await user.save({ session });
        await session.commitTransaction();

        // TODO: Send cancellation confirmation email

        return res.status(200).json({
            success: true,
            message: 'Subscription cancelled successfully',
            refundProcessed: payment?.status === 'refunded'
        });

    } catch (error) {
        await session.abortTransaction();
        console.error('Error in cancelSubscription:', error);
        
        // Handle specific Razorpay errors
        if (error.error?.description) {
            return next(errorhandler(error.statusCode || 400, error.error.description));
        }
        
        return next(errorhandler(500, 'Failed to cancel subscription. Please try again or contact support.'));
    } finally {
        session.endSession();
    }
};
export const allPayments=async(req,res,next)=>{
    try{

    }
    catch(error){
        return next(errorhandler(400,error.message))
    }
}   