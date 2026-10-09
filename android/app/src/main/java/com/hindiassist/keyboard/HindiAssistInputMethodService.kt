package com.hindiassist.keyboard

import android.inputmethodservice.InputMethodService
import android.os.Build
import android.view.View
import android.view.inputmethod.EditorInfo
import android.view.inputmethod.InputMethodManager
import com.hindiassist.clipboard.ClipboardManager
import com.hindiassist.theme.ColorTheme
import com.hindiassist.translation.TranslationManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch

/**
 * HindiAssistInputMethodService
 * 
 * Legitimate Android InputMethodService functioning as a privacy-first
 * multilingual translation assistant.
 * 
 * Guarantees:
 * - NO WhatsApp background scraping or database snooping.
 * - NO keystroke logging or analytic uploads.
 * - Password/OTP fields automatically identified and excluded from translation.
 * - Seamless switching back to the user's primary keyboard.
 */
class HindiAssistInputMethodService : InputMethodService(), KeyboardView.KeyboardActionListener {

    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.Main)

    private val inputConnectionManager = InputConnectionManager()
    private val keyboardController = KeyboardController()
    private lateinit var translationManager: TranslationManager
    private lateinit var clipboardManager: ClipboardManager

    private var keyboardView: KeyboardView? = null
    private var currentThemeIndex = 0
    private val themes = listOf(
        ColorTheme.DAY,
        ColorTheme.NIGHT,
        ColorTheme.BLUE,
        ColorTheme.GREEN,
        ColorTheme.READING
    )

    override fun onCreate() {
        super.onCreate()
        translationManager = TranslationManager()
        clipboardManager = ClipboardManager(this)
    }

    override fun onCreateInputView(): View {
        val view = KeyboardView(this)
        view.actionListener = this
        keyboardView = view

        serviceScope.launch {
            keyboardController.uiState.collect { state ->
                keyboardView?.updateState(state)
            }
        }

        return view
    }

    override fun onStartInputView(info: EditorInfo?, restarting: Boolean) {
        super.onStartInputView(info, restarting)

        // Sensitive / Password Field Protection
        val isSensitive = inputConnectionManager.isSensitiveField(info)
        keyboardController.setSensitiveMode(isSensitive)
    }

    override fun onDirectionSelected(source: String, target: String, isAuto: Boolean) {
        keyboardController.setDirection(source, target, isAuto)
    }

    override fun onClipboardTranslateRequested() {
        if (keyboardController.uiState.value.isSensitiveInput) return

        // 1. Explicit read only when user taps
        val clipboardText = clipboardManager.readExplicitClipboard()
        if (clipboardText.isNullOrBlank()) {
            keyboardController.updateTranslation("Clipboard is empty or no text copied.")
            return
        }

        keyboardController.setProcessing(true)
        val state = keyboardController.uiState.value

        serviceScope.launch {
            val result = translationManager.translate(
                text = clipboardText,
                requestedSourceLang = if (state.isAutoDetect) "auto" else state.sourceLang,
                targetLang = state.targetLang,
                tone = state.currentTone
            )
            keyboardController.updateTranslation(
                result = result.translatedText,
                detectedLabel = result.detectedLang.uppercase(),
                sourceBadge = result.processingSource
            )
        }
    }

    override fun onTranslateCurrentTextRequested() {
        if (keyboardController.uiState.value.isSensitiveInput) return

        val ic = currentInputConnection
        val selected = inputConnectionManager.getSelectedText(ic)
        val textToTranslate = selected ?: ic?.getTextBeforeCursor(200, 0)?.toString()?.trim()

        if (textToTranslate.isNullOrBlank()) {
            keyboardController.updateTranslation("Type or select text, then tap Translate.")
            return
        }

        keyboardController.setProcessing(true)
        val state = keyboardController.uiState.value

        serviceScope.launch {
            val result = translationManager.translate(
                text = textToTranslate,
                requestedSourceLang = if (state.isAutoDetect) "auto" else state.sourceLang,
                targetLang = state.targetLang,
                tone = state.currentTone
            )
            keyboardController.updateTranslation(
                result = result.translatedText,
                detectedLabel = result.detectedLang.uppercase(),
                sourceBadge = result.processingSource
            )
        }
    }

    override fun onInsertRequested() {
        val state = keyboardController.uiState.value
        if (state.isSensitiveInput || state.translationPreview.isBlank()) return

        val ic = currentInputConnection
        // Explicit, user-triggered commitText into current field
        inputConnectionManager.insertText(ic, state.translationPreview)
    }

    override fun onCopyRequested() {
        val preview = keyboardController.uiState.value.translationPreview
        if (preview.isNotBlank()) {
            clipboardManager.copyToClipboard("Hindi Assist Translation", preview)
        }
    }

    override fun onThemeCycleRequested() {
        currentThemeIndex = (currentThemeIndex + 1) % themes.size
        val theme = themes[currentThemeIndex]
        keyboardView?.applyTheme(theme)
    }

    override fun onSwitchToSystemKeyboardRequested() {
        val imm = getSystemService(INPUT_METHOD_SERVICE) as? InputMethodManager
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            switchToPreviousInputMethod()
        } else {
            imm?.showInputMethodPicker()
        }
    }

    override fun onKeyPress(text: String) {
        currentInputConnection?.commitText(text, 1)
    }

    override fun onBackspacePress() {
        inputConnectionManager.sendBackspace(currentInputConnection)
    }

    override fun onEnterPress() {
        inputConnectionManager.sendEnter(currentInputConnection, currentInputEditorInfo)
    }

    override fun onSpacePress() {
        currentInputConnection?.commitText(" ", 1)
    }

    override fun onDestroy() {
        super.onDestroy()
        serviceScope.cancel()
    }
}
