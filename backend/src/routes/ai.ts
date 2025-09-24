import express from 'express';
import multer from 'multer';
import Joi from 'joi';
import { AIService } from '../services/aiService';
import { authenticate } from '../middleware/auth';
import { validateOrThrow } from '../utils/validation';

const router = express.Router();

// File upload configuration for PDFs
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 10, // Maximum 10 files
  },
  fileFilter: (req, file, cb) => {
    // Only allow PDF files
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
});

// Validation schemas
const generateQuizSchema = Joi.object({
  subject: Joi.string().min(1).max(100).required(),
  gradeLevel: Joi.string().max(50).allow('').optional(),
  numQuestions: Joi.number().integer().min(1).max(20).optional(),
  difficulty: Joi.string().valid('easy', 'medium', 'hard').optional(),
  questionType: Joi.string().valid('multiple_choice', 'true_false').optional(),
  title: Joi.string().max(200).optional(),
  pdfText: Joi.string().optional(),
  pdfs: Joi.array().items(
    Joi.object({
      pdfBase64: Joi.string().required(),
      fileName: Joi.string().required(),
      fileSize: Joi.number().integer().positive().required(),
    })
  ).optional(),
});

const generateFlashcardsSchema = Joi.object({
  subject: Joi.string().min(1).max(100).required(),
  gradeLevel: Joi.string().max(50).required(),
  numCards: Joi.number().integer().min(1).max(50).optional(),
  title: Joi.string().max(200).optional(),
  difficulty: Joi.string().valid('easy', 'medium', 'hard').optional(),
  pdfText: Joi.string().optional(),
  pdfs: Joi.array().items(
    Joi.object({
      pdfBase64: Joi.string().required(),
      fileName: Joi.string().required(),
      fileSize: Joi.number().integer().positive().required(),
    })
  ).optional(),
});

// Generate AI quiz questions
router.post('/generate', authenticate, async (req, res) => {
  try {
    const validatedData = validateOrThrow(generateQuizSchema, req.body);
    const result = await AIService.generateQuizQuestions(validatedData);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('AI quiz generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate quiz questions',
    });
  }
});

// Generate AI flashcards
router.post('/flashcards', authenticate, async (req, res) => {
  try {
    const validatedData = validateOrThrow(generateFlashcardsSchema, req.body);
    const result = await AIService.generateFlashcards(validatedData);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('AI flashcard generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate flashcards',
    });
  }
});

// Upload PDFs for AI processing (legacy endpoint)
router.post('/pdf/upload', authenticate, upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No PDF files provided',
      });
    }

    const files = req.files as Express.Multer.File[];

    if (files.length > 10) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 10 PDF files allowed',
      });
    }

    const pdfData = files.map(file => ({
      pdfBase64: file.buffer.toString('base64'),
      fileName: file.originalname,
      fileSize: file.size,
    }));

    res.json({
      success: true,
      data: {
        pdfs: pdfData,
        totalFiles: pdfData.length,
      },
    });
  } catch (error: any) {
    console.error('PDF upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload PDFs',
    });
  }
});

// Extract text from uploaded PDFs
router.post('/pdf/extract-text', authenticate, upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No PDF files provided',
      });
    }

    const files = req.files as Express.Multer.File[];

    if (files.length > 10) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 10 PDF files allowed',
      });
    }

    const results = [];

    for (const file of files) {
      try {
        console.log(`Processing PDF: ${file.originalname} (${file.size} bytes)`);

        const { text, truncated } = await AIService.extractPdfText(file.buffer);

        results.push({
          fileName: file.originalname,
          fileSize: file.size,
          pdfText: text,
          truncated,
        });

        console.log(`Extracted ${text.length} characters from ${file.originalname}`);
      } catch (fileError: any) {
        console.error(`Error processing ${file.originalname}:`, fileError);
        results.push({
          fileName: file.originalname,
          fileSize: file.size,
          pdfText: '',
          truncated: false,
          error: 'Failed to extract text from this PDF',
        });
      }
    }

    res.json({
      success: true,
      data: {
        pdfs: results,
        totalFiles: results.length,
      },
    });
  } catch (error: any) {
    console.error('PDF text extraction error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to extract text from PDFs',
      details: error.message,
    });
  }
});

export default router;
