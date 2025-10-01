const mongoose = require('mongoose');
const { User } = require('./dist/models/User');
const { Subject } = require('./dist/models/Subject');
const { TutorNote } = require('./dist/models/TutorNote');

async function addTutorMaterials() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/mathmentor', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Get existing data
    const tutor = await User.findOne({ email: 'tutor@test.com' });
    const subjects = await Subject.find({ isActive: true });

    if (!tutor) {
      console.log('No tutor found. Run test-data.js first.');
      return;
    }

    if (subjects.length === 0) {
      console.log('No subjects found. Run test-data.js first.');
      return;
    }

    console.log('Found tutor:', tutor.email);
    console.log('Found subjects:', subjects.map(s => s.displayName));

    // Check if tutor materials already exist
    const existingMaterials = await TutorNote.find({ createdBy: tutor._id });
    if (existingMaterials.length > 0) {
      console.log('Tutor materials already exist:', existingMaterials.length);
      return;
    }

    // Create sample tutor materials
    const materials = [
      {
        title: 'Introduction to Quadratic Equations',
        description: 'A comprehensive guide to understanding quadratic equations, their solutions, and real-world applications.',
        content: `# Introduction to Quadratic Equations

Quadratic equations are polynomial equations of the form:

**ax² + bx + c = 0**

where a, b, and c are constants and a ≠ 0.

## The Quadratic Formula

The solutions to ax² + bx + c = 0 are given by:

**x = [-b ± √(b² - 4ac)] / 2a**

## Discriminant

The discriminant (D = b² - 4ac) tells us about the nature of roots:
- D > 0: Two distinct real roots
- D = 0: One real root (repeated)
- D < 0: Two complex roots

## Example

Solve: x² - 5x + 6 = 0

Using the quadratic formula:
x = [5 ± √(25 - 24)] / 2 = [5 ± √1] / 2

x₁ = (5 + 1) / 2 = 3
x₂ = (5 - 1) / 2 = 2`,
        subjectId: subjects[0]._id, // Mathematics
        createdBy: tutor._id,
        isPremium: false,
        isActive: true,
        viewCount: 15,
        downloadCount: 3,
        tags: ['algebra', 'equations', 'quadratic'],
        previewContent: 'Learn about quadratic equations, the quadratic formula, and how to solve them step by step.'
      },
      {
        title: 'Newton\'s Laws of Motion',
        description: 'Understanding the fundamental principles of motion as described by Sir Isaac Newton.',
        content: `# Newton's Laws of Motion

## First Law (Law of Inertia)
An object at rest stays at rest, and an object in motion stays in motion with the same speed and in the same direction unless acted upon by an unbalanced force.

**Inertia** is the tendency of an object to resist changes in its velocity.

## Second Law (F = ma)
The acceleration of an object is directly proportional to the net force acting on it and inversely proportional to its mass.

**F = ma**

Where:
- F is the net force (N)
- m is the mass (kg)
- a is the acceleration (m/s²)

## Third Law (Action-Reaction)
For every action, there is an equal and opposite reaction.

**Forces always come in pairs!**

## Real-World Applications
- Seatbelts protect us during car accidents (First Law)
- Rockets propel themselves by expelling gas (Third Law)
- Calculating force needed to accelerate a car (Second Law)`,
        subjectId: subjects[1]._id, // Physics
        createdBy: tutor._id,
        isPremium: false,
        isActive: true,
        viewCount: 22,
        downloadCount: 7,
        tags: ['physics', 'motion', 'newton'],
        previewContent: 'Explore Newton\'s three fundamental laws that govern motion in the universe.'
      },
      {
        title: 'Advanced Calculus: Integration Techniques',
        description: 'Master advanced integration methods including substitution, integration by parts, and trigonometric integrals.',
        content: `# Advanced Integration Techniques

This premium material covers advanced integration methods that are essential for higher-level mathematics and physics courses.

## Integration by Substitution
When you see a composite function inside an integral, substitution can simplify the problem.

**Example:**
∫ 2x(x² + 1)^3 dx

Let u = x² + 1
Then du = 2x dx

Substitute: ∫ u³ du = (1/4)u⁴ + C = (1/4)(x² + 1)^4 + C

## Integration by Parts
For products of functions: ∫ u dv = uv - ∫ v du

**Example:**
∫ x e^x dx

Let u = x, dv = e^x dx
Then du = dx, v = e^x

Result: x e^x - ∫ e^x dx = x e^x - e^x + C = e^x (x - 1) + C

## Trigonometric Integrals
Common trigonometric integrals include:
- ∫ sin(ax) dx = (-1/a) cos(ax) + C
- ∫ cos(ax) dx = (1/a) sin(ax) + C
- ∫ sec²(ax) dx = (1/a) tan(ax) + C`,
        subjectId: subjects[0]._id, // Mathematics
        createdBy: tutor._id,
        isPremium: true,
        isActive: true,
        viewCount: 8,
        downloadCount: 1,
        tags: ['calculus', 'integration', 'advanced'],
        price: 9.99,
        previewContent: 'Advanced integration techniques for serious math students. Covers substitution, integration by parts, and trigonometric integrals.'
      }
    ];

    const createdMaterials = await TutorNote.insertMany(materials);
    console.log('Created tutor materials:', createdMaterials.length);

    createdMaterials.forEach((material, index) => {
      console.log(`${index + 1}. ${material.title} (${material.isPremium ? 'Premium' : 'Free'})`);
    });

    console.log('Tutor materials added successfully!');

  } catch (error) {
    console.error('Error adding tutor materials:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

addTutorMaterials();
