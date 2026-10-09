package com.hindiassist.translation

import com.google.mlkit.common.model.RemoteModelManager
import com.google.mlkit.nl.translate.TranslateLanguage
import com.google.mlkit.nl.translate.TranslateRemoteModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume

enum class ModelStatus {
    READY,
    DOWNLOADING,
    NOT_INSTALLED,
    FAILED_RETRY
}

class ModelManager {

    private val modelManager = RemoteModelManager.getInstance()

    private val _hindiStatus = MutableStateFlow(ModelStatus.NOT_INSTALLED)
    val hindiStatus: StateFlow<ModelStatus> = _hindiStatus

    private val _teluguStatus = MutableStateFlow(ModelStatus.NOT_INSTALLED)
    val teluguStatus: StateFlow<ModelStatus> = _teluguStatus

    suspend fun checkModelStatus(languageCode: String): ModelStatus {
        if (languageCode == "en") return ModelStatus.READY // English base is always packaged/ready

        val mlKitLang = when (languageCode) {
            "hi" -> TranslateLanguage.HINDI
            "te" -> TranslateLanguage.TELUGU
            else -> return ModelStatus.NOT_INSTALLED
        }

        val model = TranslateRemoteModel.Builder(mlKitLang).build()
        return suspendCancellableCoroutine { continuation ->
            modelManager.isModelDownloaded(model)
                .addOnSuccessListener { isDownloaded ->
                    val status = if (isDownloaded) ModelStatus.READY else ModelStatus.NOT_INSTALLED
                    if (languageCode == "hi") _hindiStatus.value = status
                    if (languageCode == "te") _teluguStatus.value = status
                    continuation.resume(status)
                }
                .addOnFailureListener {
                    val status = ModelStatus.FAILED_RETRY
                    if (languageCode == "hi") _hindiStatus.value = status
                    if (languageCode == "te") _teluguStatus.value = status
                    continuation.resume(status)
                }
        }
    }

    suspend fun downloadModel(languageCode: String): Boolean {
        val mlKitLang = when (languageCode) {
            "hi" -> {
                _hindiStatus.value = ModelStatus.DOWNLOADING
                TranslateLanguage.HINDI
            }
            "te" -> {
                _teluguStatus.value = ModelStatus.DOWNLOADING
                TranslateLanguage.TELUGU
            }
            else -> return false
        }

        val model = TranslateRemoteModel.Builder(mlKitLang).build()
        return suspendCancellableCoroutine { continuation ->
            val conditions = com.google.mlkit.common.model.DownloadConditions.Builder().build()
            modelManager.download(model, conditions)
                .addOnSuccessListener {
                    if (languageCode == "hi") _hindiStatus.value = ModelStatus.READY
                    if (languageCode == "te") _teluguStatus.value = ModelStatus.READY
                    continuation.resume(true)
                }
                .addOnFailureListener {
                    if (languageCode == "hi") _hindiStatus.value = ModelStatus.FAILED_RETRY
                    if (languageCode == "te") _teluguStatus.value = ModelStatus.FAILED_RETRY
                    continuation.resume(false)
                }
        }
    }
}
