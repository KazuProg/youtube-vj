/**
 * アプリケーション設定のスキーマ定義
 * 新しい設定を追加する際はここのみを編集する
 */
export const CONFIG_SCHEMA = {
  fadeoutVolume: {
    default: true,
    type: "boolean",
    message: "fadeoutVolume must be a boolean value",
  },
  openLibrary: {
    default: false,
    type: "boolean", 
    message: "openLibrary must be a boolean value",
  },
  youtubeAPIKey: {
    default: "",
    type: "string",
    message: "youtubeAPIKey must be a string",
  },
  youtubeAPIRequests: {
    default: 10,
    type: "number",
    validator: (value) => Number.isInteger(value) && value >= 0,
    message: "youtubeAPIRequests must be a non-negative integer",
  },
};

/**
 * スキーマからデフォルト設定を生成
 * @returns {Object} デフォルト設定オブジェクト
 */
export function getDefaultConfig() {
  const defaultConfig = {};
  for (const key in CONFIG_SCHEMA) {
    defaultConfig[key] = CONFIG_SCHEMA[key].default;
  }
  return defaultConfig;
}

/**
 * スキーマから検証ルールを生成
 * @returns {Object} 検証ルールオブジェクト
 */
export function getValidationRules() {
  const validationRules = {};
  for (const key in CONFIG_SCHEMA) {
    const { default: _, ...rule } = CONFIG_SCHEMA[key];
    validationRules[key] = rule;
  }
  return validationRules;
} 