package com.hindiassist.history

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "translation_history")
data class TranslationHistory(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val originalText: String,
    val translatedText: String,
    val sourceLang: String,
    val targetLang: String,
    val direction: String, // e.g. "EN → HI"
    val timestamp: Long = System.currentTimeMillis(),
    val isFavorite: Boolean = false,
    val label: String? = null,
    val translationMode: String = "📱 On-device"
)
