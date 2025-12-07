# Contributing to Solana Game Analytics

First off, thank you for considering contributing to Solana Game Analytics! 🎉 It's people like you that make this platform a powerful tool for the Solana gaming community.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Community](#community)

---

## Code of Conduct

This project and everyone participating in it is governed by our commitment to fostering an open and welcoming environment. We pledge to make participation in our project a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, gender identity and expression, level of experience, nationality, personal appearance, race, religion, or sexual identity and orientation.

**Expected Behavior:**
- Use welcoming and inclusive language
- Be respectful of differing viewpoints and experiences
- Gracefully accept constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members

**Unacceptable Behavior:**
- Trolling, insulting/derogatory comments, and personal or political attacks
- Public or private harassment
- Publishing others' private information without explicit permission
- Other conduct which could reasonably be considered inappropriate

---

## How Can I Contribute?

### 🐛 Reporting Bugs

Before creating bug reports, please check the [existing issues](https://github.com/joshuatochinwachi/Solana-Game-Signals-and-Predictive-Modelling/issues) to avoid duplicates.

**Good Bug Reports Include:**
- **Clear title**: Descriptive summary of the issue
- **Steps to reproduce**: Detailed steps to recreate the bug
- **Expected behavior**: What you expected to happen
- **Actual behavior**: What actually happened
- **Screenshots**: If applicable
- **Environment**: OS, browser, Node/Python version
- **Additional context**: Any other relevant information

**Bug Report Template:**
```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
 - OS: [e.g. macOS 13.0]
 - Browser: [e.g. Chrome 120]
 - Node Version: [e.g. 18.17.0]
 - Python Version: [e.g. 3.11.5]

**Additional context**
Any other context about the problem.
```

### 💡 Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

- **Use case**: Why is this enhancement useful?
- **Proposed solution**: How should it work?
- **Alternatives considered**: What other approaches did you think about?
- **Additional context**: Screenshots, mockups, or examples

### 🔧 Contributing Code

**Great First Issues:**
We label issues with `good first issue` for newcomers. These are typically:
- Documentation improvements
- Minor bug fixes
- UI/UX enhancements
- Test coverage additions

**Contribution Areas:**
1. **Backend (Python/FastAPI)**
   - New analytics endpoints
   - ML model improvements
   - Cache optimization
   - API performance enhancements

2. **Frontend (React/TypeScript)**
   - New visualizations
   - UI component improvements
   - Accessibility enhancements
   - Mobile responsiveness

3. **Machine Learning**
   - Feature engineering ideas
   - New model algorithms
   - Hyperparameter tuning
   - Prediction accuracy improvements

4. **Documentation**
   - API documentation
   - Code comments
   - Tutorial creation
   - README improvements

---

## Development Setup

### Prerequisites

**Backend:**
- Python 3.11+
- pip or poetry
- Virtual environment tool (venv, conda, etc.)

**Frontend:**
- Node.js 18+
- npm or yarn

### Backend Setup

```bash
# Clone the repository
git clone https://github.com/joshuatochinwachi/Solana-Game-Signals-and-Predictive-Modelling
cd Solana-Game-Signals-and-Predictive-Modelling/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment variables
cp .env.example .env
# Add your Dune API key(s)

# Run development server
uvicorn main:app --reload --port 8000

# Run tests
pytest tests/ -v

# Run linter
flake8 main.py
# or
ruff check main.py
```

### Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Set VITE_API_BASE_URL=http://localhost:8000

# Run development server
npm run dev

# Run tests
npm test

# Run linter
npm run lint

# Type check
npm run type-check

# Build for production
npm run build
```

### Running Both Simultaneously

**Option 1: Two Terminals**
```bash
# Terminal 1 - Backend
cd backend && uvicorn main:app --reload

# Terminal 2 - Frontend
cd frontend && npm run dev
```

**Option 2: Using Docker Compose** (if available)
```bash
docker-compose up
```

---

## Pull Request Process

### 1. Fork & Clone

```bash
# Fork the repo on GitHub, then:
git clone https://github.com/YOUR_USERNAME/Solana-Game-Signals-and-Predictive-Modelling.git
cd Solana-Game-Signals-and-Predictive-Modelling
git remote add upstream https://github.com/joshuatochinwachi/Solana-Game-Signals-and-Predictive-Modelling.git
```

### 2. Create a Branch

```bash
# Use descriptive branch names
git checkout -b feature/add-new-visualization
git checkout -b fix/cache-timeout-issue
git checkout -b docs/update-api-reference
```

**Branch Naming Convention:**
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation only
- `refactor/` - Code refactoring
- `test/` - Adding tests
- `chore/` - Maintenance tasks

### 3. Make Your Changes

- Write clear, concise commit messages
- Follow the coding standards (see below)
- Add tests for new features
- Update documentation as needed
- Keep commits atomic (one logical change per commit)

### 4. Commit Your Changes

```bash
git add .
git commit -m "feat: add churn prediction heatmap visualization"
```

**Commit Message Format:**
```
<type>: <subject>

<body (optional)>

<footer (optional)>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```bash
git commit -m "feat: add user segmentation by risk level"
git commit -m "fix: resolve cache invalidation timing issue"
git commit -m "docs: update ML model training documentation"
git commit -m "refactor: extract prediction logic into service layer"
```

### 5. Keep Your Branch Updated

```bash
# Fetch latest changes from upstream
git fetch upstream
git rebase upstream/main
```

### 6. Push & Create PR

```bash
# Push to your fork
git push origin feature/your-feature-name

# Then create a Pull Request on GitHub
```

### 7. PR Checklist

Before submitting, ensure:

- [ ] Code follows project style guidelines
- [ ] All tests pass (`pytest` for backend, `npm test` for frontend)
- [ ] New tests added for new features
- [ ] Documentation updated (README, docstrings, comments)
- [ ] No console errors or warnings
- [ ] PR description explains what and why
- [ ] Linked related issues (e.g., "Closes #123")
- [ ] Screenshots/GIFs for UI changes
- [ ] No merge conflicts

### 8. PR Template

Your PR description should include:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related Issues
Closes #123

## Testing
How did you test this?

## Screenshots (if applicable)
[Add screenshots here]

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] All tests passing
```

---

## Coding Standards

### Python (Backend)

**Style Guide:** PEP 8

```python
# Good
def calculate_churn_risk(user_id: str, features: dict) -> float:
    """
    Calculate churn risk for a given user.
    
    Args:
        user_id: Unique identifier for the user
        features: Dictionary of engineered features
        
    Returns:
        Churn probability between 0 and 1
    """
    try:
        prediction = model.predict_proba([features])[0][1]
        return round(prediction, 4)
    except Exception as e:
        logger.error(f"Churn prediction failed for {user_id}: {e}")
        raise

# Bad
def calc(u,f):
    return model.predict_proba([f])[0][1]
```

**Key Principles:**
- Use type hints for all function parameters and returns
- Write docstrings for all public functions/classes
- Keep functions under 50 lines when possible
- Use descriptive variable names
- Handle exceptions explicitly
- Log errors with context
- Avoid global variables

**Formatting:**
```bash
# Use Black for auto-formatting
black main.py --line-length 88

# Use isort for import sorting
isort main.py

# Check with flake8
flake8 main.py --max-line-length 88
```

### TypeScript/React (Frontend)

**Style Guide:** Airbnb JavaScript Style Guide (adapted for TypeScript)

```typescript
// Good
interface ChurnPrediction {
  userId: string;
  gameId: string;
  churnRisk: number;
  riskLevel: 'low' | 'medium' | 'high';
  lastActivity: string;
}

const ChurnRiskCard: React.FC<{ prediction: ChurnPrediction }> = ({ 
  prediction 
}) => {
  const riskColor = useMemo(() => {
    if (prediction.churnRisk > 0.65) return 'red';
    if (prediction.churnRisk > 0.35) return 'yellow';
    return 'green';
  }, [prediction.churnRisk]);

  return (
    <div className="risk-card" data-risk={prediction.riskLevel}>
      {/* Card content */}
    </div>
  );
};

// Bad
const Card = (props) => {
  let color;
  if (props.risk > 0.65) color = 'red';
  else if (props.risk > 0.35) color = 'yellow';
  else color = 'green';
  return <div style={{color}}>{props.user}</div>;
};
```

**Key Principles:**
- Use TypeScript strict mode
- Define interfaces/types for all props and state
- Use functional components with hooks
- Avoid inline styles (use Tailwind classes)
- Extract complex logic into custom hooks
- Keep components under 200 lines
- Use meaningful component names
- Memoize expensive calculations

**Formatting:**
```bash
# Use Prettier
npm run format

# Lint with ESLint
npm run lint

# Type check
npm run type-check
```

### File Naming Conventions

```
Backend (Python):
- snake_case.py for modules
- PascalCase for classes
- snake_case for functions/variables

Frontend (TypeScript):
- PascalCase.tsx for components
- camelCase.ts for utilities
- kebab-case.css for stylesheets
```

---

## Testing Guidelines

### Backend Tests (pytest)

```python
# tests/test_ml.py
import pytest
from main import calculate_churn_risk, train_models

def test_churn_risk_calculation():
    """Test churn risk calculation returns valid probability."""
    features = {
        'active_days_last_7': 3,
        'transactions_last_7': 15,
        'days_since_last_activity': 2
    }
    risk = calculate_churn_risk('user123', features)
    
    assert 0 <= risk <= 1, "Risk should be between 0 and 1"
    assert isinstance(risk, float), "Risk should be a float"

def test_train_models_with_insufficient_data():
    """Test model training handles insufficient data gracefully."""
    with pytest.raises(ValueError, match="Insufficient training samples"):
        train_models(sample_count=50)
```

**Run Tests:**
```bash
# Run all tests
pytest tests/ -v

# Run specific test file
pytest tests/test_ml.py -v

# Run with coverage
pytest tests/ --cov=main --cov-report=html
```

### Frontend Tests (Jest/Vitest)

```typescript
// tests/components/ChurnRiskCard.test.tsx
import { render, screen } from '@testing-library/react';
import { ChurnRiskCard } from '@/components/ml/ChurnRiskCard';

describe('ChurnRiskCard', () => {
  it('renders high risk correctly', () => {
    const prediction = {
      userId: 'abc123',
      gameId: 'staratlas',
      churnRisk: 0.85,
      riskLevel: 'high' as const,
      lastActivity: '2024-12-01'
    };

    render(<ChurnRiskCard prediction={prediction} />);
    
    expect(screen.getByText(/high risk/i)).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();
  });
});
```

**Run Tests:**
```bash
# Run all tests
npm test

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage
```

---

## Documentation

### Code Comments

```python
# Good: Explain WHY, not WHAT
# Use ensemble method to reduce variance from individual models
ensemble_prediction = np.average(predictions, weights=model_weights)

# Bad: States the obvious
# Calculate average
ensemble_prediction = np.average(predictions, weights=model_weights)
```

### API Documentation

All new endpoints must include:
- Route decorator with summary
- Request/response models (Pydantic)
- Docstring with description
- Example request/response in docstring

```python
@app.get(
    "/api/analytics/new-endpoint",
    response_model=NewEndpointResponse,
    summary="Brief description",
    tags=["analytics"]
)
async def new_endpoint(
    param: str = Query(..., description="Parameter description")
):
    """
    Detailed description of what this endpoint does.
    
    Example Response:
    ```json
    {
      "data": [...],
      "metadata": {...}
    }
    ```
    """
    pass
```

### README Updates

When adding features, update:
- Feature list in README.md
- API endpoints table
- Technology stack (if new dependencies)
- Setup instructions (if process changes)

---

## Community

### Where to Get Help

- **Issues**: [GitHub Issues](https://github.com/joshuatochinwachi/Solana-Game-Signals-and-Predictive-Modelling/issues)
- **Discussions**: [GitHub Discussions](https://github.com/joshuatochinwachi/Solana-Game-Signals-and-Predictive-Modelling/discussions)
- **Email**: joshuatochinwachi@gmail.com

### Recognition

All contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Credited in the dashboard footer

---

## Questions?

Don't hesitate to ask! We'd rather answer questions than receive incomplete PRs. Open a discussion or comment on an issue, and we'll help guide you.

**Thank you for contributing to Solana Game Analytics! 🚀**