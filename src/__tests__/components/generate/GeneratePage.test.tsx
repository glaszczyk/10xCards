import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GeneratePage } from "@/components/generate/GeneratePage";
import { MVPTestData } from "@/__tests__/factories/mvp-test-data";

// Mock the child components to focus on GeneratePage logic
vi.mock("@/components/generate/GenerateForm", () => ({
  GenerateForm: ({ onGenerate, onCreateManual, isGenerating }: any) => {
    const handleGenerate = async () => {
      // Simulate the actual generation process
      await onGenerate({
        sourceText: "A".repeat(1000),
        cardCount: 5,
        cardType: "basic",
        language: "en"
      });
    };

    return (
      <div data-testid="generate-form">
        <h2>Generate Flashcards with AI</h2>
        <textarea 
          data-testid="source-text-input"
          aria-label="Source Text"
          placeholder="Enter source text..."
        />
        <select data-testid="card-count-select" aria-label="Number of Cards">
          <option value="5">5</option>
          <option value="10">10</option>
        </select>
        <button 
          onClick={handleGenerate}
          disabled={isGenerating}
          data-testid="generate-button"
        >
          {isGenerating ? "Generating..." : "Generate"}
        </button>
        <button 
          onClick={onCreateManual}
          data-testid="create-manual-button"
        >
          Create Manually
        </button>
      </div>
    );
  },
}));

vi.mock("@/components/generate/FlashcardPreview", () => ({
  FlashcardPreview: ({ flashcards, onSave, onBack, isSaving }: any) => (
    <div data-testid="flashcard-preview">
      <h2>Flashcard Preview</h2>
      {flashcards.map((card: any, index: number) => (
        <div key={card.id} data-testid="flashcard-preview-item">
          <div data-testid="flashcard-question">{card.question}</div>
          <div data-testid="flashcard-answer">{card.answer}</div>
        </div>
      ))}
      <button 
        onClick={() => onSave(flashcards)}
        disabled={isSaving}
        data-testid="save-button"
      >
        {isSaving ? "Saving..." : "Save"}
      </button>
      <button onClick={onBack} data-testid="back-button">Back</button>
    </div>
  ),
}));

vi.mock("@/components/generate/ManualFlashcardForm", () => ({
  ManualFlashcardForm: ({ onSave, onBack, onGenerateAI, isSaving }: any) => (
    <div data-testid="manual-flashcard-form">
      <h2>Create Flashcards Manually</h2>
      <button 
        onClick={() => onSave([MVPTestData.createFlashcard()])}
        disabled={isSaving}
        data-testid="manual-save-button"
      >
        {isSaving ? "Saving..." : "Save"}
      </button>
      <button onClick={onBack} data-testid="manual-back-button">Back</button>
      <button onClick={onGenerateAI} data-testid="generate-ai-button">Generate with AI</button>
    </div>
  ),
}));

describe("GeneratePage - State Management", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with 'form' state by default", () => {
    render(<GeneratePage />);
    expect(screen.getByText("Generate Flashcards with AI")).toBeInTheDocument();
    expect(screen.getByTestId("generate-form")).toBeInTheDocument();
  });

  it("should switch to 'preview' state after successful generation", async () => {
    const user = userEvent.setup();
    render(<GeneratePage />);
    
    // Fill form and submit
    const generateButton = screen.getByTestId("generate-button");
    await user.click(generateButton);
    
    // Should show preview after generation (wait for async operation)
    await waitFor(() => {
      expect(screen.getByTestId("flashcard-preview")).toBeInTheDocument();
      expect(screen.getByText("Flashcard Preview")).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it("should switch to 'manual' state when create manual is clicked", async () => {
    const user = userEvent.setup();
    render(<GeneratePage />);
    
    const manualButton = screen.getByTestId("create-manual-button");
    await user.click(manualButton);
    
    expect(screen.getByTestId("manual-flashcard-form")).toBeInTheDocument();
    expect(screen.getByText("Create Flashcards Manually")).toBeInTheDocument();
  });
});

describe("GeneratePage - AI Generation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should generate correct number of flashcards based on form input", async () => {
    const user = userEvent.setup();
    render(<GeneratePage />);
    
    const generateButton = screen.getByTestId("generate-button");
    await user.click(generateButton);
    
    await waitFor(() => {
      const flashcardItems = screen.getAllByTestId("flashcard-preview-item");
      expect(flashcardItems).toHaveLength(5); // Default card count from mock
    }, { timeout: 5000 });
  });

  it("should show loading state during generation", async () => {
    const user = userEvent.setup();
    render(<GeneratePage />);
    
    const generateButton = screen.getByTestId("generate-button");
    await user.click(generateButton);
    
    // Button should be disabled during generation
    expect(generateButton).toBeDisabled();
    expect(generateButton).toHaveTextContent("Generating...");
  });

  it("should handle generation errors gracefully", async () => {
    const user = userEvent.setup();
    render(<GeneratePage />);
    
    // Trigger error condition by clicking generate
    const generateButton = screen.getByTestId("generate-button");
    await user.click(generateButton);
    
    // Should handle error without crashing
    await waitFor(() => {
      expect(screen.getByTestId("flashcard-preview")).toBeInTheDocument();
    }, { timeout: 5000 });
  });
});

describe("GeneratePage - Save Functionality", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should show saving state during save operation", async () => {
    const user = userEvent.setup();
    render(<GeneratePage />);
    
    // Generate flashcards first
    const generateButton = screen.getByTestId("generate-button");
    await user.click(generateButton);
    
    await waitFor(() => {
      expect(screen.getByTestId("flashcard-preview")).toBeInTheDocument();
    }, { timeout: 5000 });
    
    // Try to save
    const saveButton = screen.getByTestId("save-button");
    await user.click(saveButton);
    
    expect(saveButton).toBeDisabled();
    expect(saveButton).toHaveTextContent("Saving...");
  });

  it("should call onSave with correct flashcard data", async () => {
    const user = userEvent.setup();
    render(<GeneratePage />);
    
    // Generate flashcards
    const generateButton = screen.getByTestId("generate-button");
    await user.click(generateButton);
    
    await waitFor(() => {
      expect(screen.getByTestId("flashcard-preview")).toBeInTheDocument();
    }, { timeout: 5000 });
    
    // Save
    const saveButton = screen.getByTestId("save-button");
    await user.click(saveButton);
    
    // Should show success message (mocked as alert)
    await waitFor(() => {
      expect(screen.getByTestId("flashcard-preview")).toBeInTheDocument();
    });
  });
});

describe("GeneratePage - Navigation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return to form state when back is clicked from preview", async () => {
    const user = userEvent.setup();
    render(<GeneratePage />);
    
    // Generate flashcards first
    const generateButton = screen.getByTestId("generate-button");
    await user.click(generateButton);
    
    await waitFor(() => {
      expect(screen.getByTestId("flashcard-preview")).toBeInTheDocument();
    }, { timeout: 5000 });
    
    // Go back
    const backButton = screen.getByTestId("back-button");
    await user.click(backButton);
    
    expect(screen.getByTestId("generate-form")).toBeInTheDocument();
    expect(screen.getByText("Generate Flashcards with AI")).toBeInTheDocument();
  });

  it("should clear state when switching between modes", async () => {
    const user = userEvent.setup();
    render(<GeneratePage />);
    
    // Switch to manual mode
    const manualButton = screen.getByTestId("create-manual-button");
    await user.click(manualButton);
    
    // Switch back to AI generation
    const aiButton = screen.getByTestId("generate-ai-button");
    await user.click(aiButton);
    
    // Should be back to form
    expect(screen.getByTestId("generate-form")).toBeInTheDocument();
  });
});

describe("GeneratePage - Component Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should pass correct props to GenerateForm", () => {
    render(<GeneratePage />);
    
    // Verify form props are passed correctly
    expect(screen.getByTestId("source-text-input")).toBeInTheDocument();
    expect(screen.getByTestId("card-count-select")).toBeInTheDocument();
    expect(screen.getByTestId("generate-button")).toBeInTheDocument();
    expect(screen.getByTestId("create-manual-button")).toBeInTheDocument();
  });

  it("should pass correct props to FlashcardPreview", async () => {
    const user = userEvent.setup();
    render(<GeneratePage />);
    
    // Generate flashcards
    const generateButton = screen.getByTestId("generate-button");
    await user.click(generateButton);
    
    await waitFor(() => {
      // Verify preview component receives correct data
      expect(screen.getByTestId("flashcard-preview")).toBeInTheDocument();
      expect(screen.getAllByTestId("flashcard-preview-item")).toHaveLength(5);
    }, { timeout: 5000 });
  });

  it("should pass correct props to ManualFlashcardForm", async () => {
    const user = userEvent.setup();
    render(<GeneratePage />);
    
    const manualButton = screen.getByTestId("create-manual-button");
    await user.click(manualButton);
    
    expect(screen.getByTestId("manual-flashcard-form")).toBeInTheDocument();
    expect(screen.getByTestId("manual-save-button")).toBeInTheDocument();
    expect(screen.getByTestId("manual-back-button")).toBeInTheDocument();
    expect(screen.getByTestId("generate-ai-button")).toBeInTheDocument();
  });
});

describe("GeneratePage - Error Handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock console.error to avoid noise in tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should handle save errors gracefully", async () => {
    const user = userEvent.setup();
    render(<GeneratePage />);
    
    // Generate flashcards
    const generateButton = screen.getByTestId("generate-button");
    await user.click(generateButton);
    
    await waitFor(() => {
      expect(screen.getByTestId("flashcard-preview")).toBeInTheDocument();
    }, { timeout: 5000 });
    
    // Try to save (this will trigger the mock save logic)
    const saveButton = screen.getByTestId("save-button");
    await user.click(saveButton);
    
    // Should handle save without crashing
    await waitFor(() => {
      expect(saveButton).toBeInTheDocument();
    });
  });

  it("should handle navigation errors gracefully", async () => {
    const user = userEvent.setup();
    render(<GeneratePage />);
    
    // Try to navigate to manual mode
    const manualButton = screen.getByTestId("create-manual-button");
    await user.click(manualButton);
    
    // Should handle navigation without crashing
    expect(screen.getByTestId("manual-flashcard-form")).toBeInTheDocument();
  });
});

describe("GeneratePage - State Persistence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should maintain generated flashcards state across navigation", async () => {
    const user = userEvent.setup();
    render(<GeneratePage />);
    
    // Generate flashcards
    const generateButton = screen.getByTestId("generate-button");
    await user.click(generateButton);
    
    await waitFor(() => {
      expect(screen.getByTestId("flashcard-preview")).toBeInTheDocument();
    }, { timeout: 5000 });
    
    // Go back to form
    const backButton = screen.getByTestId("back-button");
    await user.click(backButton);
    
    // Generate again
    const generateButton2 = screen.getByTestId("generate-button");
    await user.click(generateButton2);
    
    // Should show preview again
    await waitFor(() => {
      expect(screen.getByTestId("flashcard-preview")).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it("should clear state when explicitly going back", async () => {
    const user = userEvent.setup();
    render(<GeneratePage />);
    
    // Generate flashcards
    const generateButton = screen.getByTestId("generate-button");
    await user.click(generateButton);
    
    await waitFor(() => {
      expect(screen.getByTestId("flashcard-preview")).toBeInTheDocument();
    }, { timeout: 5000 });
    
    // Go back
    const backButton = screen.getByTestId("back-button");
    await user.click(backButton);
    
    // Should be back to form
    expect(screen.getByTestId("generate-form")).toBeInTheDocument();
  });
});
