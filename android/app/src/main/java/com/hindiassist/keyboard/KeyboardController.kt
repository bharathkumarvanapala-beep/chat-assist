package com.hindiassist.keyboard

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

data class KeyboardUiState(
    val sourceLang: String = "en",
    val targetLang: String = "hi",
    val isAutoDetect: Boolean = false,
    val currentTone: String = "Casual",
    val translationPreview: String = "",
    val detectedLangLabel: String = "EN",
    val isSensitiveInput: Boolean = false,
    val isProcessing: Boolean = false,
    val statusBadge: String = "📱 On-device",
    val canInsert: Boolean = false
)

class KeyboardController {

    private val _uiState = MutableStateFlow(KeyboardUiState())
    val uiState: StateFlow<KeyboardUiState> = _uiState

    fun setDirection(source: String, target: String, isAuto: Boolean = false) {
        _uiState.value = _uiState.value.copy(
            sourceLang = source,
            targetLang = target,
            isAutoDetect = isAuto
        )
    }

    fun setTone(tone: String) {
        _uiState.value = _uiState.value.copy(currentTone = tone)
    }

    fun setSensitiveMode(isSensitive: Boolean) {
        _uiState.value = _uiState.value.copy(
            isSensitiveInput = isSensitive,
            translationPreview = if (isSensitive) "" else _uiState.value.translationPreview,
            canInsert = if (isSensitive) false else _uiState.value.canInsert
        )
    }

    fun setProcessing(isProcessing: Boolean) {
        _uiState.value = _uiState.value.copy(isProcessing = isProcessing)
    }

    fun updateTranslation(result: String, detectedLabel: String = "EN", sourceBadge: String = "📱 On-device") {
        _uiState.value = _uiState.value.copy(
            translationPreview = result,
            detectedLangLabel = detectedLabel,
            statusBadge = sourceBadge,
            canInsert = result.isNotBlank(),
            isProcessing = false
        )
    }

    fun clearTranslation() {
        _uiState.value = _uiState.value.copy(
            translationPreview = "",
            canInsert = false,
            isProcessing = false
        )
    }
}
