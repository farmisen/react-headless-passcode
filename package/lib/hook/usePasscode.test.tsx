import "@testing-library/jest-dom";
import { act, render, renderHook, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BaseSyntheticEvent } from "react";
import usePasscode from "./usePasscode";

const TestComponent = (props: { isAlphaNumeric: boolean }) => {
    const { passcode, getEventHandlers, refs } = usePasscode({
        count: 4,
        isAlphaNumeric: props.isAlphaNumeric,
    });

    return (
        <>
            {passcode.map((value: string | number, index: number) => (
                <input
                    ref={(el) => el && (refs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={1}
                    pattern="\d{1}"
                    value={String(value)}
                    key={`index-${index}`}
                    data-testid={`index-${index}`}
                    {...getEventHandlers(index)}
                />
            ))}
        </>
    );
};

describe("test basic workflow", () => {
    it("1. test whether passing count prop creates an array(input elements) with size count", () => {
        render(<TestComponent isAlphaNumeric={false} />);
        expect(screen.getAllByTestId(/index-[0-9]/)).toHaveLength(4);
    });

    it("2. test if the focus changes to next element when typed", async () => {
        render(<TestComponent isAlphaNumeric={false} />);
        // focus on the first input
        const firstInput: HTMLInputElement = screen.getByTestId("index-0");
        firstInput.focus();
        expect(firstInput).toHaveFocus();

        //Type in first input and check the focus of next input
        userEvent.type(firstInput, "1");
        const secondtInput: HTMLInputElement = screen.getByTestId("index-1");
        await waitFor(() => {
            expect(secondtInput).toHaveFocus();
        });

        // Verify that the value of first input is 1
        expect(firstInput).toHaveValue("1");
    });


    it("3. test if the focus changes to next element when the zero digit is typed", async () => {
        render(<TestComponent isAlphaNumeric={false} />);
        // focus on the first input
        const firstInput: HTMLInputElement = screen.getByTestId("index-0");
        firstInput.focus();
        expect(firstInput).toHaveFocus();

        //Type in first input and check the focus of next input
        userEvent.type(firstInput, "0");
        const secondtInput: HTMLInputElement = screen.getByTestId("index-1");
        await waitFor(() => {
            expect(secondtInput).toHaveFocus();
        });

        // Verify that the value of first input is 0
        expect(firstInput).toHaveValue("0");
    });


    it("4. test if the focus changes to previous element when backspaced", async () => {
        render(<TestComponent isAlphaNumeric={false} />);
        // focus on the first input
        const firstInput: HTMLInputElement = screen.getByTestId("index-0");
        firstInput.focus();

        //Type in first input and check the focus of next input
        userEvent.type(firstInput, "1");
        const secondInput: HTMLInputElement = screen.getByTestId("index-1");
        await waitFor(() => {
            expect(secondInput).toHaveFocus();
        });

        //Backspace and observe focus shift
        userEvent.keyboard("{Backspace}");
        await waitFor(() => {
            expect(firstInput).toHaveFocus();
        });

        // Verify that the value of second input is empty
        expect(secondInput).toHaveValue("");
    });


    it("5. test if the focus changes to previous element when backspaced over the zero digit", async () => {
        render(<TestComponent isAlphaNumeric={false} />);
        // focus on the first input
        const firstInput: HTMLInputElement = screen.getByTestId("index-0");
        firstInput.focus();

        //Type in first input and check the focus of next input
        userEvent.type(firstInput, "0");
        const secondInput: HTMLInputElement = screen.getByTestId("index-1");
        await waitFor(() => {
            expect(secondInput).toHaveFocus();
        });

        //Backspace and observe focus shift
        userEvent.keyboard("{Backspace}");
        await waitFor(() => {
            expect(firstInput).toHaveFocus();
        });

        // Verify that the value of second input is empty
        expect(secondInput).toHaveValue("");
    });
});

describe("test value types in passcode array", () => {
    const mockEvent = (value: string) =>
        ({ target: { value } } as BaseSyntheticEvent);

    it("1. zero digit should be stored as number, not string", () => {
        const { result } = renderHook(() =>
            usePasscode({ count: 4, isAlphaNumeric: false })
        );

        act(() => {
            const onChange = result.current.getEventHandlers(0).onChange;
            onChange(mockEvent("0"));
        });

        expect(result.current.passcode[0]).toBe(0);
        expect(typeof result.current.passcode[0]).toBe("number");
    });

    it("2. all numeric digits should be stored as numbers", () => {
        const { result } = renderHook(() =>
            usePasscode({ count: 4, isAlphaNumeric: false })
        );

        const digits = ["1", "2", "0", "9"];
        act(() => {
            digits.forEach((digit, index) => {
                const onChange = result.current.getEventHandlers(index).onChange;
                onChange(mockEvent(digit));
            });
        });

        expect(result.current.passcode).toEqual([1, 2, 0, 9]);
        result.current.passcode.forEach((value) => {
            expect(typeof value).toBe("number");
        });
    });

    it("3. alphanumeric mode should store letters as strings", () => {
        const { result } = renderHook(() =>
            usePasscode({ count: 4, isAlphaNumeric: true })
        );

        const chars = ["a", "1", "b", "0"];
        act(() => {
            chars.forEach((char, index) => {
                const onChange = result.current.getEventHandlers(index).onChange;
                onChange(mockEvent(char));
            });
        });

        expect(result.current.passcode).toEqual(["a", 1, "b", 0]);
    });

    it("4. numeric mode should not store non-numeric input", () => {
        const { result } = renderHook(() =>
            usePasscode({ count: 4, isAlphaNumeric: false })
        );

        act(() => {
            const onChange = result.current.getEventHandlers(0).onChange;
            onChange(mockEvent("a"));
        });

        expect(result.current.passcode[0]).toBe("");
    });
});
