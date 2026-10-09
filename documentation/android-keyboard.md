# Android Translation Keyboard Architecture

## 1. InputMethodService Implementation
Hindi Assist implements an official Android IME service via [HindiAssistInputMethodService.kt](file:///c:/Users/AI%20PC/Desktop/chat%20assist/hindi-assist/android/app/src/main/java/com/hindiassist/keyboard/HindiAssistInputMethodService.kt).

```kotlin
class HindiAssistInputMethodService : InputMethodService(), KeyboardView.KeyboardActionListener
```

### 1.1 Toolbar Layout
The keyboard provides a compact horizontal toolbar containing:
- `[EN → HI]`, `[HI → EN]`, `[TE → HI]`, `[HI → TE]`, `[AUTO]`
- `[📋 Clipboard]`: Explicitly accesses clipboard text and triggers instant translation.
- `[Translate]`: Translates current selection or surrounding typed text.
- `[Insert]`: Commits text into the current text field via `InputConnection.commitText(text, 1)`.
- `[Copy]`: Copies the candidate translation.
- `[🎨 Theme]`: Cycles themes (Day, Night, Blue, Green, Reading).
- `[⌨ Switch]`: Calls `switchToPreviousInputMethod()` to seamlessly return to the user's primary keyboard.

### 1.2 Sensitive Input Protection
In `onStartInputView(info: EditorInfo?, restarting: Boolean)`:
```kotlin
val isSensitive = inputConnectionManager.isSensitiveField(info)
keyboardController.setSensitiveMode(isSensitive)
```
When password or OTP input classes are detected:
- Translation assistance is disabled.
- No text is logged or stored.
- Sensitive banner displayed: `🔒 Password/sensitive field detected. Translation assistant disabled.`
