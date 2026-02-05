/**
 * CaptionStylePanel Component Tests
 *
 * Verifies all style controls are present and function correctly.
 *
 * **Validates: Requirements 8.2-8.7**
 * - 8.2: Font size adjustment controls
 * - 8.3: Color pickers for text, background, and highlight colors
 * - 8.4: Position controls (top, center, bottom)
 * - 8.5: Alignment controls (left, center, right)
 * - 8.6: Shadow and outline effect toggles
 * - 8.7: Preset caption styles (covered by separate component)
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  CaptionStylePanel,
  SUPPORTED_FONTS,
  FONT_SIZE_MIN,
  FONT_SIZE_MAX,
  OPACITY_MIN,
  OPACITY_MAX,
  clampFontSize,
  clampOpacity,
  isValidFont,
  getFontFamily,
} from "./caption-style-panel";
import type { CaptionStyle } from "@/lib/api/captions";

// Default style for testing
const defaultStyle: CaptionStyle = {
  fontFamily: "Inter",
  fontSize: 24,
  textColor: "#FFFFFF",
  backgroundColor: "#000000",
  backgroundOpacity: 80,
  position: "bottom",
  alignment: "center",
  animation: "none",
  highlightColor: "#FFFF00",
  highlightEnabled: true,
  shadow: false,
  outline: false,
  outlineColor: "#000000",
};

describe("CaptionStylePanel", () => {
  let mockOnChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnChange = vi.fn();
  });

  describe("Component Rendering", () => {
    it("renders the caption style panel with all sections", () => {
      render(<CaptionStylePanel style={defaultStyle} onChange={mockOnChange} />);

      // Check main sections are present
      expect(screen.getByText("Caption Style")).toBeInTheDocument();
      expect(screen.getByText("Typography")).toBeInTheDocument();
      expect(screen.getByText("Colors")).toBeInTheDocument();
      expect(screen.getByText("Position & Alignment")).toBeInTheDocument();
      expect(screen.getByText("Effects")).toBeInTheDocument();
    });

    it("renders with aria-label for accessibility", () => {
      render(<CaptionStylePanel style={defaultStyle} onChange={mockOnChange} />);

      expect(
        screen.getByRole("region", { name: "Caption style customization" })
      ).toBeInTheDocument();
    });
  });


  /**
   * Requirement 8.1: Font selector with viral-optimized fonts
   * (Verified in task 7.1, but included here for completeness)
   */
  describe("Font Selector (Requirement 8.1)", () => {
    it("renders font family dropdown", () => {
      render(<CaptionStylePanel style={defaultStyle} onChange={mockOnChange} />);

      expect(screen.getByText("Font Family")).toBeInTheDocument();
      expect(screen.getByRole("combobox", { name: /select font family/i })).toBeInTheDocument();
    });

    it("displays current font family value", () => {
      render(<CaptionStylePanel style={defaultStyle} onChange={mockOnChange} />);

      const trigger = screen.getByRole("combobox", { name: /select font family/i });
      expect(trigger).toHaveTextContent("Inter");
    });

    it("includes viral-optimized fonts in the list", async () => {
      const user = userEvent.setup();
      render(<CaptionStylePanel style={defaultStyle} onChange={mockOnChange} />);

      // Open the dropdown
      const trigger = screen.getByRole("combobox", { name: /select font family/i });
      await user.click(trigger);

      // Check for viral fonts section header
      await waitFor(() => {
        expect(screen.getByText("Viral Fonts")).toBeInTheDocument();
      });

      // Check for specific viral fonts
      expect(screen.getByRole("option", { name: /Bangers/i })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: /Permanent Marker/i })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: /Anton/i })).toBeInTheDocument();
    });
  });

  /**
   * Requirement 8.2: Font size adjustment controls
   */
  describe("Font Size Controls (Requirement 8.2)", () => {
    it("renders font size slider with label", () => {
      render(<CaptionStylePanel style={defaultStyle} onChange={mockOnChange} />);

      expect(screen.getByText("Font Size")).toBeInTheDocument();
    });

    it("displays current font size value with unit", () => {
      render(<CaptionStylePanel style={defaultStyle} onChange={mockOnChange} />);

      expect(screen.getByText("24px")).toBeInTheDocument();
    });

    it("displays min and max font size labels", () => {
      render(<CaptionStylePanel style={defaultStyle} onChange={mockOnChange} />);

      expect(screen.getByText("12px")).toBeInTheDocument();
      expect(screen.getByText("72px")).toBeInTheDocument();
    });

    it("renders font size slider with correct min/max attributes", () => {
      render(<CaptionStylePanel style={defaultStyle} onChange={mockOnChange} />);

      // The slider component uses role="group" with aria-label
      const sliderGroup = screen.getByRole("group", { name: /font size/i });
      expect(sliderGroup).toHaveAttribute("aria-valuemin", "12");
      expect(sliderGroup).toHaveAttribute("aria-valuemax", "72");
      expect(sliderGroup).toHaveAttribute("aria-valuenow", "24");
    });
  });

  /**
   * Requirement 8.3: Color pickers for text, background, and highlight colors
   */
  describe("Color Pickers (Requirement 8.3)", () => {
    it("renders text color picker", () => {
      render(<CaptionStylePanel style={defaultStyle} onChange={mockOnChange} />);

      expect(screen.getByText("Text Color")).toBeInTheDocument();
    });

    it("renders background color picker", () => {
      render(<CaptionStylePanel style={defaultStyle} onChange={mockOnChange} />);

      expect(screen.getByText("Background Color")).toBeInTheDocument();
    });

    it("renders highlight color picker", () => {
      render(<CaptionStylePanel style={defaultStyle} onChange={mockOnChange} />);

      expect(screen.getByText("Highlight Color")).toBeInTheDocument();
    });

    it("renders background opacity slider", () => {
      render(<CaptionStylePanel style={defaultStyle} onChange={mockOnChange} />);

      expect(screen.getByText("Background Opacity")).toBeInTheDocument();
      expect(screen.getByText("80%")).toBeInTheDocument();
    });

    it("displays opacity slider with correct min/max", () => {
      render(<CaptionStylePanel style={defaultStyle} onChange={mockOnChange} />);

      // The slider component uses role="group" with aria-label
      const sliderGroup = screen.getByRole("group", { name: /background opacity/i });
      expect(sliderGroup).toHaveAttribute("aria-valuemin", "0");
      expect(sliderGroup).toHaveAttribute("aria-valuemax", "100");
    });

    it("displays all three color picker buttons", () => {
      render(<CaptionStylePanel style={defaultStyle} onChange={mockOnChange} />);

      // Color pickers have buttons to open the popover
      const colorButtons = screen.getAllByRole("button", { name: /select.*color/i });
      expect(colorButtons.length).toBeGreaterThanOrEqual(3);
    });
  });


  /**
   * Requirement 8.4: Position controls (top, center, bottom)
   */
  describe("Position Controls (Requirement 8.4)", () => {
    it("renders position selector with label", () => {
      render(<CaptionStylePanel style={defaultStyle} onChange={mockOnChange} />);

      expect(screen.getByText("Position")).toBeInTheDocument();
    });

    it("renders all three position options (top, center, bottom)", () => {
      render(<CaptionStylePanel style={defaultStyle} onChange={mockOnChange} />);

      expect(screen.getByRole("button", { name: /^top$/i })).toBeInTheDocument();
      // There are two "center" buttons (position and alignment), so we check for at least 2
      const centerButtons = screen.getAllByRole("button", { name: /^center$/i });
      expect(centerButtons.length).toBe(2);
      expect(screen.getByRole("button", { name: /^bottom$/i })).toBeInTheDocument();
    });

    it("shows current position as selected", () => {
      render(<CaptionStylePanel style={defaultStyle} onChange={mockOnChange} />);

      const bottomButton = screen.getByRole("button", { name: /^bottom$/i });
      expect(bottomButton).toHaveAttribute("aria-pressed", "true");
    });

    it("calls onChange when position is changed", async () => {
      const user = userEvent.setup();
      render(<CaptionStylePanel style={defaultStyle} onChange={mockOnChange} />);

      const topButton = screen.getByRole("button", { name: /^top$/i });
      await user.click(topButton);

      // Wait for debounce (300ms)
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(
          expect.objectContaining({ position: "top" })
        );
      }, { timeout: 500 });
    });
  });

  /**
   * Requirement 8.5: Alignment controls (left, center, right)
   */
  describe("Alignment Controls (Requirement 8.5)", () => {
    it("renders alignment selector with label", () => {
      render(<CaptionStylePanel style={defaultStyle} onChange={mockOnChange} />);

      expect(screen.getByText("Alignment")).toBeInTheDocument();
    });

    it("renders all three alignment options (left, center, right)", () => {
      render(<CaptionStylePanel style={defaultStyle} onChange={mockOnChange} />);

      expect(screen.getByRole("button", { name: /^left$/i })).toBeInTheDocument();
      // Note: There are two "center" buttons (position and alignment)
      const centerButtons = screen.getAllByRole("button", { name: /^center$/i });
      expect(centerButtons.length).toBe(2);
      expect(screen.getByRole("button", { name: /^right$/i })).toBeInTheDocument();
    });

    it("shows current alignment as selected", () => {
      render(<CaptionStylePanel style={defaultStyle} onChange={mockOnChange} />);

      // Find the alignment center button - it's the one that's pressed and in the alignment section
      const centerButtons = screen.getAllByRole("button", { name: /^center$/i });
      // One of them should be pressed (alignment center)
      const pressedCenterButtons = centerButtons.filter(
        (btn) => btn.getAttribute("aria-pressed") === "true"
      );
      expect(pressedCenterButtons.length).toBeGreaterThanOrEqual(1);
    });

    it("calls onChange when alignment is changed", async () => {
      const user = userEvent.setup();
      render(<CaptionStylePanel style={defaultStyle} onChange={mockOnChange} />);

      const leftButton = screen.getByRole("button", { name: /^left$/i });
      await user.click(leftButton);

      // Wait for debounce (300ms)
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(
          expect.objectContaining({ alignment: "left" })
        );
      }, { timeout: 500 });
    });
  });


  /**
   * Requirement 8.6: Shadow and outline effect toggles
   */
  describe("Effect Toggles (Requirement 8.6)", () => {
    it("renders text shadow toggle", () => {
      render(<CaptionStylePanel style={defaultStyle} onChange={mockOnChange} />);

      expect(screen.getByText("Text Shadow")).toBeInTheDocument();
      expect(screen.getByText("Add a drop shadow behind text")).toBeInTheDocument();
    });

    it("renders text outline toggle", () => {
      render(<CaptionStylePanel style={defaultStyle} onChange={mockOnChange} />);

      expect(screen.getByText("Text Outline")).toBeInTheDocument();
      expect(screen.getByText("Add an outline around text")).toBeInTheDocument();
    });

    it("renders shadow switch with correct initial state", () => {
      render(<CaptionStylePanel style={defaultStyle} onChange={mockOnChange} />);

      const shadowSwitch = screen.getByRole("switch", { name: /text shadow/i });
      expect(shadowSwitch).toHaveAttribute("aria-checked", "false");
    });

    it("renders outline switch with correct initial state", () => {
      render(<CaptionStylePanel style={defaultStyle} onChange={mockOnChange} />);

      const outlineSwitch = screen.getByRole("switch", { name: /text outline/i });
      expect(outlineSwitch).toHaveAttribute("aria-checked", "false");
    });

    it("calls onChange when shadow is toggled", async () => {
      const user = userEvent.setup();
      render(<CaptionStylePanel style={defaultStyle} onChange={mockOnChange} />);

      const shadowSwitch = screen.getByRole("switch", { name: /text shadow/i });
      await user.click(shadowSwitch);

      // Wait for debounce (300ms)
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(
          expect.objectContaining({ shadow: true })
        );
      }, { timeout: 500 });
    });

    it("calls onChange when outline is toggled", async () => {
      const user = userEvent.setup();
      render(<CaptionStylePanel style={defaultStyle} onChange={mockOnChange} />);

      const outlineSwitch = screen.getByRole("switch", { name: /text outline/i });
      await user.click(outlineSwitch);

      // Wait for debounce (300ms)
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(
          expect.objectContaining({ outline: true })
        );
      }, { timeout: 500 });
    });

    it("shows outline color picker when outline is enabled", () => {
      const styleWithOutline: CaptionStyle = {
        ...defaultStyle,
        outline: true,
      };

      render(<CaptionStylePanel style={styleWithOutline} onChange={mockOnChange} />);

      expect(screen.getByText("Outline Color")).toBeInTheDocument();
    });

    it("hides outline color picker when outline is disabled", () => {
      render(<CaptionStylePanel style={defaultStyle} onChange={mockOnChange} />);

      expect(screen.queryByText("Outline Color")).not.toBeInTheDocument();
    });
  });

  /**
   * Disabled state tests
   */
  describe("Disabled State", () => {
    it("disables font selector when disabled prop is true", () => {
      render(
        <CaptionStylePanel style={defaultStyle} onChange={mockOnChange} disabled />
      );

      // Check font selector is disabled
      const fontSelector = screen.getByRole("combobox", { name: /select font family/i });
      expect(fontSelector).toBeDisabled();
    });

    it("disables switches when disabled prop is true", () => {
      render(
        <CaptionStylePanel style={defaultStyle} onChange={mockOnChange} disabled />
      );

      // Check switches are disabled (they use aria-disabled)
      const switches = screen.getAllByRole("switch");
      switches.forEach((switchEl) => {
        expect(switchEl).toHaveAttribute("aria-disabled", "true");
      });
    });

    it("disables position/alignment buttons when disabled prop is true", () => {
      render(
        <CaptionStylePanel style={defaultStyle} onChange={mockOnChange} disabled />
      );

      // Check position/alignment buttons are disabled
      const topButton = screen.getByRole("button", { name: /^top$/i });
      const leftButton = screen.getByRole("button", { name: /^left$/i });
      expect(topButton).toBeDisabled();
      expect(leftButton).toBeDisabled();
    });
  });
});


/**
 * Helper function tests
 */
describe("CaptionStylePanel Helper Functions", () => {
  describe("clampFontSize", () => {
    it("returns value within bounds unchanged", () => {
      expect(clampFontSize(24)).toBe(24);
      expect(clampFontSize(12)).toBe(12);
      expect(clampFontSize(72)).toBe(72);
    });

    it("clamps values below minimum to minimum", () => {
      expect(clampFontSize(0)).toBe(FONT_SIZE_MIN);
      expect(clampFontSize(-10)).toBe(FONT_SIZE_MIN);
      expect(clampFontSize(11)).toBe(FONT_SIZE_MIN);
    });

    it("clamps values above maximum to maximum", () => {
      expect(clampFontSize(100)).toBe(FONT_SIZE_MAX);
      expect(clampFontSize(73)).toBe(FONT_SIZE_MAX);
    });
  });

  describe("clampOpacity", () => {
    it("returns value within bounds unchanged", () => {
      expect(clampOpacity(50)).toBe(50);
      expect(clampOpacity(0)).toBe(0);
      expect(clampOpacity(100)).toBe(100);
    });

    it("clamps values below minimum to minimum", () => {
      expect(clampOpacity(-10)).toBe(OPACITY_MIN);
    });

    it("clamps values above maximum to maximum", () => {
      expect(clampOpacity(150)).toBe(OPACITY_MAX);
      expect(clampOpacity(101)).toBe(OPACITY_MAX);
    });
  });

  describe("isValidFont", () => {
    it("returns true for supported fonts", () => {
      expect(isValidFont("Inter")).toBe(true);
      expect(isValidFont("Bangers")).toBe(true);
      expect(isValidFont("Moji Pop")).toBe(true);
    });

    it("returns false for unsupported fonts", () => {
      expect(isValidFont("Comic Sans")).toBe(false);
      expect(isValidFont("Arial")).toBe(false);
      expect(isValidFont("")).toBe(false);
    });
  });

  describe("getFontFamily", () => {
    it("returns correct CSS font-family for known fonts", () => {
      expect(getFontFamily("Bangers")).toBe("var(--font-bangers), cursive");
      expect(getFontFamily("Inter")).toBe("Inter, sans-serif");
    });

    it("returns font name as-is for unknown fonts", () => {
      expect(getFontFamily("Unknown Font")).toBe("Unknown Font");
    });
  });

  describe("SUPPORTED_FONTS constant", () => {
    it("includes all viral-optimized fonts", () => {
      const viralFonts = [
        "Moji Pop",
        "Line",
        "Brishti",
        "Deep",
        "Depo B",
        "Bangers",
        "Permanent Marker",
        "Anton",
        "Bebas Neue",
        "Oswald",
      ];

      viralFonts.forEach((font) => {
        expect(SUPPORTED_FONTS).toContain(font);
      });
    });

    it("includes standard fonts", () => {
      const standardFonts = ["Inter", "Roboto", "Open Sans", "Montserrat", "Poppins"];

      standardFonts.forEach((font) => {
        expect(SUPPORTED_FONTS).toContain(font);
      });
    });
  });

  describe("Font size bounds constants", () => {
    it("has correct minimum font size", () => {
      expect(FONT_SIZE_MIN).toBe(12);
    });

    it("has correct maximum font size", () => {
      expect(FONT_SIZE_MAX).toBe(72);
    });
  });

  describe("Opacity bounds constants", () => {
    it("has correct minimum opacity", () => {
      expect(OPACITY_MIN).toBe(0);
    });

    it("has correct maximum opacity", () => {
      expect(OPACITY_MAX).toBe(100);
    });
  });
});
