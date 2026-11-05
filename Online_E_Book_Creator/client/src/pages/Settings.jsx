import React, { useEffect, useState } from "react";
import {
  Save, RotateCcw, Bell, Palette, Type, CheckCircle
} from "lucide-react";

import Sidebar from "../components/Sidebar";
import "./Settings.css";

const DEFAULT_SETTINGS = {
  theme: "light",
  fontSize: 18,
  fontFamily: "Georgia",
  lineSpacing: 1.7,
  notifications: true,
  autoSave: true,
};

const getSavedSettings = () => {
  try {
    const saved = localStorage.getItem("bookcraft-settings");
    if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
  } catch (error) {
    console.error("Unable to load settings:", error);
  }
  return { ...DEFAULT_SETTINGS };
};

const applyTheme = theme => {
  document.documentElement.dataset.theme = theme;
};

function Settings() {
  const [settings, setSettings] = useState(getSavedSettings);
  const [savedMessage, setSavedMessage] = useState("");

  useEffect(() => {
    applyTheme(settings.theme);
  }, [settings.theme]);

  const handleChange = (name, value) => {
    setSettings(previous => ({ ...previous, [name]: value }));
    setSavedMessage("");
  };

  const handleSave = () => {
    try {
      localStorage.setItem("bookcraft-settings", JSON.stringify(settings));
      applyTheme(settings.theme);
      window.dispatchEvent(new Event("bookcraft-settings-updated"));
      setSavedMessage("Settings saved successfully!");
    } catch (error) {
      console.error("Unable to save settings:", error);
      setSavedMessage("Unable to save settings. Please try again.");
    }
  };

  const handleReset = () => {
    const defaults = { ...DEFAULT_SETTINGS };
    setSettings(defaults);

    try {
      localStorage.setItem("bookcraft-settings", JSON.stringify(defaults));
      applyTheme(defaults.theme);
      window.dispatchEvent(new Event("bookcraft-settings-updated"));
      setSavedMessage("Settings restored to default!");
    } catch (error) {
      console.error("Unable to reset settings:", error);
      setSavedMessage("Unable to reset settings. Please try again.");
    }
  };

  return (
    <div className="settings-page">
      <Sidebar />

      <main className="settings-main">
        <div className="settings-header">
          <div>
            <h1>Settings</h1>
            <p>Customize your BookCraft experience.</p>
          </div>
        </div>

        <section className="settings-card">
          <div className="settings-section-heading">
            <Palette size={23} />
            <div>
              <h2>Appearance</h2>
              <p>Choose how BookCraft looks on your device.</p>
            </div>
          </div>

          <div className="settings-option">
            <div>
              <h3>Theme</h3>
              <p>Select your preferred appearance.</p>
            </div>
            <select
              value={settings.theme}
              onChange={e => handleChange("theme", e.target.value)}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System Default</option>
            </select>
          </div>
        </section>

        <section className="settings-card">
          <div className="settings-section-heading">
            <Type size={23} />
            <div>
              <h2>Reading Preferences</h2>
              <p>Customize your reading experience.</p>
            </div>
          </div>

          <div className="settings-option">
            <div>
              <h3>Font Size</h3>
              <p>Adjust the size of reading text.</p>
            </div>
            <div className="settings-control">
              <input
                type="range"
                min="12"
                max="30"
                value={settings.fontSize}
                onChange={e => handleChange("fontSize", Number(e.target.value))}
              />
              <span>{settings.fontSize}px</span>
            </div>
          </div>

          <div className="settings-option">
            <div>
              <h3>Font Family</h3>
              <p>Choose your preferred reading font.</p>
            </div>
            <select
              value={settings.fontFamily}
              onChange={e => handleChange("fontFamily", e.target.value)}
            >
              <option value="Georgia">Georgia</option>
              <option value="Arial">Arial</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Verdana">Verdana</option>
            </select>
          </div>

          <div className="settings-option">
            <div>
              <h3>Line Spacing</h3>
              <p>Adjust the spacing between lines.</p>
            </div>
            <select
              value={settings.lineSpacing}
              onChange={e => handleChange("lineSpacing", Number(e.target.value))}
            >
              <option value="1.2">Compact</option>
              <option value="1.5">Normal</option>
              <option value="1.7">Comfortable</option>
              <option value="2">Wide</option>
            </select>
          </div>
        </section>

        <section className="settings-card">
          <div className="settings-section-heading">
            <Bell size={23} />
            <div>
              <h2>Notifications</h2>
              <p>Manage your notification preferences.</p>
            </div>
          </div>

          <div className="settings-option">
            <div>
              <h3>Enable Notifications</h3>
              <p>Receive updates and notifications.</p>
            </div>
            <label className="settings-switch">
              <input
                type="checkbox"
                checked={settings.notifications}
                onChange={e => handleChange("notifications", e.target.checked)}
              />
              <span className="settings-slider"></span>
            </label>
          </div>

          <div className="settings-option">
            <div>
              <h3>Auto Save</h3>
              <p>Automatically save your book changes.</p>
            </div>
            <label className="settings-switch">
              <input
                type="checkbox"
                checked={settings.autoSave}
                onChange={e => handleChange("autoSave", e.target.checked)}
              />
              <span className="settings-slider"></span>
            </label>
          </div>
        </section>

        <div className="settings-actions">
          <button className="settings-reset-btn" onClick={handleReset}>
            <RotateCcw size={18} />
            Reset to Default
          </button>
          <button className="settings-save-btn" onClick={handleSave}>
            <Save size={18} />
            Save Settings
          </button>
        </div>

        {savedMessage && (
          <div className="settings-message">
            <CheckCircle size={19} />
            {savedMessage}
          </div>
        )}
      </main>
    </div>
  );
}

export default Settings;