package com.hindiassist.settings

import android.content.Context
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.dataStore by preferencesDataStore(name = "hindi_assist_settings")

class SettingsRepository(private val context: Context) {

    companion object {
        val KEY_HISTORY_ENABLED = booleanPreferencesKey("history_enabled")
        val KEY_CLOUD_AI_ENABLED = booleanPreferencesKey("cloud_ai_enabled")
        val KEY_CLOUD_SYNC_ENABLED = booleanPreferencesKey("cloud_sync_enabled")
        val KEY_HISTORY_PROTECTION = booleanPreferencesKey("history_protection")
        val KEY_CURRENT_THEME = stringPreferencesKey("current_theme")
        val KEY_DEFAULT_TONE = stringPreferencesKey("default_tone")
        val KEY_AUTO_LOCK_TIMEOUT = stringPreferencesKey("auto_lock_timeout")
    }

    val isHistoryEnabled: Flow<Boolean> = context.dataStore.data.map { it[KEY_HISTORY_ENABLED] ?: false }
    val isCloudAiEnabled: Flow<Boolean> = context.dataStore.data.map { it[KEY_CLOUD_AI_ENABLED] ?: false }
    val isCloudSyncEnabled: Flow<Boolean> = context.dataStore.data.map { it[KEY_CLOUD_SYNC_ENABLED] ?: false }
    val isHistoryProtectionEnabled: Flow<Boolean> = context.dataStore.data.map { it[KEY_HISTORY_PROTECTION] ?: false }
    val currentTheme: Flow<String> = context.dataStore.data.map { it[KEY_CURRENT_THEME] ?: "Day" }
    val defaultTone: Flow<String> = context.dataStore.data.map { it[KEY_DEFAULT_TONE] ?: "Casual" }
    val autoLockTimeout: Flow<String> = context.dataStore.data.map { it[KEY_AUTO_LOCK_TIMEOUT] ?: "5 minutes" }

    suspend fun setHistoryEnabled(enabled: Boolean) {
        context.dataStore.edit { it[KEY_HISTORY_ENABLED] = enabled }
    }

    suspend fun setCloudAiEnabled(enabled: Boolean) {
        context.dataStore.edit { it[KEY_CLOUD_AI_ENABLED] = enabled }
    }

    suspend fun setCloudSyncEnabled(enabled: Boolean) {
        context.dataStore.edit { it[KEY_CLOUD_SYNC_ENABLED] = enabled }
    }

    suspend fun setHistoryProtectionEnabled(enabled: Boolean) {
        context.dataStore.edit { it[KEY_HISTORY_PROTECTION] = enabled }
    }

    suspend fun setTheme(themeName: String) {
        context.dataStore.edit { it[KEY_CURRENT_THEME] = themeName }
    }

    suspend fun setDefaultTone(tone: String) {
        context.dataStore.edit { it[KEY_DEFAULT_TONE] = tone }
    }
}
