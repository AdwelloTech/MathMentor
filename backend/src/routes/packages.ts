import express from 'express';
import { authenticate } from '../middleware/auth';
import User from '../models/User';

const router = express.Router();

// Package pricing data (hardcoded for now)
const packagePricing = [
  {
    id: 'free',
    package_type: 'free',
    display_name: 'Free Package',
    description: 'Basic access to MathMentor',
    price_monthly: 0,
    features: [
      'Access to public study materials',
      'Basic quiz functionality',
      'Limited flashcards',
      'Community support'
    ],
    session_limit: 3,
    is_active: true
  },
  {
    id: 'silver',
    package_type: 'silver',
    display_name: 'Silver Package',
    description: 'Enhanced learning experience',
    price_monthly: 1500, // $15.00 in cents
    features: [
      'All free features',
      '15 sessions per month',
      'Priority support',
      'Advanced flashcards',
      'Progress tracking',
      'Study notes access'
    ],
    session_limit: 15,
    is_active: true
  },
  {
    id: 'gold',
    package_type: 'gold',
    display_name: 'Gold Package',
    description: 'Premium learning experience',
    price_monthly: 2500, // $25.00 in cents
    features: [
      'All silver features',
      'Unlimited sessions',
      'Personal tutor matching',
      'Custom study plans',
      'Advanced analytics',
      'Premium support'
    ],
    session_limit: 1000, // Effectively unlimited
    is_active: true
  }
];

// Get all active packages
router.get('/', authenticate, (req, res) => {
  try {
    const activePackages = packagePricing.filter(pkg => pkg.is_active);
    res.json({
      success: true,
      data: activePackages
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Get package by type
router.get('/:packageType', authenticate, (req, res) => {
  try {
    const { packageType } = req.params;
    const pkg = packagePricing.find(p => p.package_type === packageType && p.is_active);

    if (!pkg) {
      return res.status(404).json({
        success: false,
        error: 'Package not found'
      });
    }

    res.json({
      success: true,
      data: pkg
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Get current student's package
router.get('/student/:studentId', authenticate, async (req, res) => {
  try {
    const { studentId } = req.params;

    // Find the user and get their actual package
    const user = await User.findById(studentId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get the package details based on user's package type
    const userPackage = packagePricing.find(p => p.package_type === (user.package || 'free'));

    if (!userPackage) {
      return res.status(404).json({
        success: false,
        error: 'Package not found'
      });
    }

    res.json({
      success: true,
      data: userPackage
    });
  } catch (error: any) {
    console.error('Error fetching student package:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Update student's package
router.put('/student/:studentId', authenticate, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { packageType } = req.body;

    // Validate package type
    if (!['free', 'silver', 'gold'].includes(packageType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid package type. Must be free, silver, or gold.'
      });
    }

    // Find and update the user
    const user = await User.findByIdAndUpdate(
      studentId,
      { package: packageType },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get the updated package details
    const updatedPackage = packagePricing.find(p => p.package_type === packageType);

    res.json({
      success: true,
      data: updatedPackage,
      message: `Package updated to ${packageType}`
    });
  } catch (error: any) {
    console.error('Error updating student package:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
