import { render, screen, waitFor } from "@testing-library/react";
import { ViralScoreDisplay } from "./viral-score-display";

describe("ViralScoreDisplay", () => {
    describe("rendering", () => {
        it("renders the component with default props", () => {
            render(<ViralScoreDisplay score={50} />);

            expect(screen.getByTestId("viral-score-display")).toBeInTheDocument();
            expect(screen.getByTestId("viral-score-circle")).toBeInTheDocument();
            expect(screen.getByTestId("viral-score-center")).toBeInTheDocument();
        });

        it("displays the score value", async () => {
            render(<ViralScoreDisplay score={75} animated={false} />);

            const scoreValue = screen.getByTestId("viral-score-value");
            expect(scoreValue).toHaveTextContent("75");
        });

        it("renders with correct ARIA attributes", () => {
            render(<ViralScoreDisplay score={85} />);

            const display = screen.getByTestId("viral-score-display");
            expect(display).toHaveAttribute("role", "meter");
            expect(display).toHaveAttribute("aria-valuenow", "85");
            expect(display).toHaveAttribute("aria-valuemin", "0");
            expect(display).toHaveAttribute("aria-valuemax", "100");
        });
    });

    describe("color coding", () => {
        it("applies green color for high scores (70-100)", () => {
            render(<ViralScoreDisplay score={85} animated={false} />);

            const center = screen.getByTestId("viral-score-center");
            expect(center).toHaveClass("text-green-600");
        });

        it("applies yellow color for medium scores (40-69)", () => {
            render(<ViralScoreDisplay score={55} animated={false} />);

            const center = screen.getByTestId("viral-score-center");
            expect(center).toHaveClass("text-yellow-600");
        });

        it("applies red color for low scores (0-39)", () => {
            render(<ViralScoreDisplay score={25} animated={false} />);

            const center = screen.getByTestId("viral-score-center");
            expect(center).toHaveClass("text-red-600");
        });

        it("shows flame icon for high viral scores", () => {
            render(<ViralScoreDisplay score={80} animated={false} />);

            expect(screen.getByTestId("viral-score-flame")).toBeInTheDocument();
        });

        it("does not show flame icon for medium scores", () => {
            render(<ViralScoreDisplay score={50} animated={false} />);

            expect(screen.queryByTestId("viral-score-flame")).not.toBeInTheDocument();
        });

        it("does not show flame icon for low scores", () => {
            render(<ViralScoreDisplay score={20} animated={false} />);

            expect(screen.queryByTestId("viral-score-flame")).not.toBeInTheDocument();
        });
    });

    describe("score categories", () => {
        it("displays 'High' category for scores >= 70", () => {
            render(<ViralScoreDisplay score={75} animated={false} />);

            expect(screen.getByTestId("viral-score-category")).toHaveTextContent(
                "High"
            );
        });

        it("displays 'Medium' category for scores 40-69", () => {
            render(<ViralScoreDisplay score={50} animated={false} />);

            expect(screen.getByTestId("viral-score-category")).toHaveTextContent(
                "Medium"
            );
        });

        it("displays 'Low' category for scores < 40", () => {
            render(<ViralScoreDisplay score={30} animated={false} />);

            expect(screen.getByTestId("viral-score-category")).toHaveTextContent(
                "Low"
            );
        });
    });

    describe("size variants", () => {
        it("renders small size variant", () => {
            render(<ViralScoreDisplay score={50} size="sm" animated={false} />);

            const circle = screen.getByTestId("viral-score-circle");
            expect(circle).toHaveClass("size-16");
        });

        it("renders medium size variant (default)", () => {
            render(<ViralScoreDisplay score={50} animated={false} />);

            const circle = screen.getByTestId("viral-score-circle");
            expect(circle).toHaveClass("size-24");
        });

        it("renders large size variant", () => {
            render(<ViralScoreDisplay score={50} size="lg" animated={false} />);

            const circle = screen.getByTestId("viral-score-circle");
            expect(circle).toHaveClass("size-32");
        });
    });

    describe("label display", () => {
        it("does not show label by default", () => {
            render(<ViralScoreDisplay score={50} animated={false} />);

            expect(screen.queryByTestId("viral-score-label")).not.toBeInTheDocument();
        });

        it("shows label when showLabel is true", () => {
            render(<ViralScoreDisplay score={50} showLabel animated={false} />);

            const label = screen.getByTestId("viral-score-label");
            expect(label).toBeInTheDocument();
            expect(label).toHaveTextContent("Viral Score");
        });

        it("shows potential label for large size with showLabel", () => {
            render(
                <ViralScoreDisplay score={75} size="lg" showLabel animated={false} />
            );

            expect(screen.getByTestId("viral-score-category-lg")).toHaveTextContent(
                "High Potential"
            );
        });
    });

    describe("animation", () => {
        it("starts at 0 when animated is true", () => {
            render(<ViralScoreDisplay score={80} animated />);

            const scoreValue = screen.getByTestId("viral-score-value");
            // Initially should be 0 or close to it
            expect(parseInt(scoreValue.textContent || "0")).toBeLessThanOrEqual(10);
        });

        it("shows final score immediately when animated is false", () => {
            render(<ViralScoreDisplay score={80} animated={false} />);

            const scoreValue = screen.getByTestId("viral-score-value");
            expect(scoreValue).toHaveTextContent("80");
        });

        it("animates to the target score", async () => {
            render(<ViralScoreDisplay score={75} animated />);

            // Wait for animation to complete
            await waitFor(
                () => {
                    const scoreValue = screen.getByTestId("viral-score-value");
                    expect(scoreValue).toHaveTextContent("75");
                },
                { timeout: 2000 }
            );
        });
    });

    describe("edge cases", () => {
        it("clamps score to 0 for negative values", () => {
            render(<ViralScoreDisplay score={-10} animated={false} />);

            const scoreValue = screen.getByTestId("viral-score-value");
            expect(scoreValue).toHaveTextContent("0");
        });

        it("clamps score to 100 for values over 100", () => {
            render(<ViralScoreDisplay score={150} animated={false} />);

            const scoreValue = screen.getByTestId("viral-score-value");
            expect(scoreValue).toHaveTextContent("100");
        });

        it("handles score of exactly 0", () => {
            render(<ViralScoreDisplay score={0} animated={false} />);

            const scoreValue = screen.getByTestId("viral-score-value");
            expect(scoreValue).toHaveTextContent("0");
            expect(screen.getByTestId("viral-score-category")).toHaveTextContent(
                "Low"
            );
        });

        it("handles score of exactly 100", () => {
            render(<ViralScoreDisplay score={100} animated={false} />);

            const scoreValue = screen.getByTestId("viral-score-value");
            expect(scoreValue).toHaveTextContent("100");
            expect(screen.getByTestId("viral-score-category")).toHaveTextContent(
                "High"
            );
        });

        it("handles boundary score of 40 (medium threshold)", () => {
            render(<ViralScoreDisplay score={40} animated={false} />);

            const center = screen.getByTestId("viral-score-center");
            expect(center).toHaveClass("text-yellow-600");
            expect(screen.getByTestId("viral-score-category")).toHaveTextContent(
                "Medium"
            );
        });

        it("handles boundary score of 70 (high threshold)", () => {
            render(<ViralScoreDisplay score={70} animated={false} />);

            const center = screen.getByTestId("viral-score-center");
            expect(center).toHaveClass("text-green-600");
            expect(screen.getByTestId("viral-score-category")).toHaveTextContent(
                "High"
            );
        });

        it("handles boundary score of 39 (just below medium)", () => {
            render(<ViralScoreDisplay score={39} animated={false} />);

            const center = screen.getByTestId("viral-score-center");
            expect(center).toHaveClass("text-red-600");
            expect(screen.getByTestId("viral-score-category")).toHaveTextContent(
                "Low"
            );
        });

        it("handles boundary score of 69 (just below high)", () => {
            render(<ViralScoreDisplay score={69} animated={false} />);

            const center = screen.getByTestId("viral-score-center");
            expect(center).toHaveClass("text-yellow-600");
            expect(screen.getByTestId("viral-score-category")).toHaveTextContent(
                "Medium"
            );
        });
    });

    describe("SVG elements", () => {
        it("renders background circle", () => {
            render(<ViralScoreDisplay score={50} animated={false} />);

            expect(screen.getByTestId("viral-score-bg-circle")).toBeInTheDocument();
        });

        it("renders progress circle", () => {
            render(<ViralScoreDisplay score={50} animated={false} />);

            expect(
                screen.getByTestId("viral-score-progress-circle")
            ).toBeInTheDocument();
        });

        it("progress circle has correct stroke color for high score", () => {
            render(<ViralScoreDisplay score={85} animated={false} />);

            const progressCircle = screen.getByTestId("viral-score-progress-circle");
            expect(progressCircle).toHaveClass("stroke-green-500");
        });

        it("progress circle has correct stroke color for medium score", () => {
            render(<ViralScoreDisplay score={55} animated={false} />);

            const progressCircle = screen.getByTestId("viral-score-progress-circle");
            expect(progressCircle).toHaveClass("stroke-yellow-500");
        });

        it("progress circle has correct stroke color for low score", () => {
            render(<ViralScoreDisplay score={25} animated={false} />);

            const progressCircle = screen.getByTestId("viral-score-progress-circle");
            expect(progressCircle).toHaveClass("stroke-red-500");
        });
    });

    describe("custom className", () => {
        it("applies custom className to container", () => {
            render(
                <ViralScoreDisplay
                    score={50}
                    className="custom-class"
                    animated={false}
                />
            );

            expect(screen.getByTestId("viral-score-display")).toHaveClass(
                "custom-class"
            );
        });
    });
});
