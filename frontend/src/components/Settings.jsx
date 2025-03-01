import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Settings.css";

const Settings = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    theme: localStorage.getItem("theme") || "default",
    notifications: JSON.parse(localStorage.getItem("notifications")) || false,
    compactView: JSON.parse(localStorage.getItem("compactView")) || false,
    timeFormat: localStorage.getItem("timeFormat") || "12h",
  });

  const [profile, setProfile] = useState({
    username: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const themes = [
    {
      id: "default",
      name: "Default Purple",
      colors: ["#c79bf0", "#a2b0e3", "#e174aa"],
    },
    {
      id: "ocean",
      name: "Ocean Blue",
      colors: ["#67e8f9", "#38bdf8", "#818cf8"],
    },
    {
      id: "forest",
      name: "Forest Green",
      colors: ["#86efac", "#4ade80", "#34d399"],
    },
    {
      id: "sunset",
      name: "Sunset",
      colors: ["#fda4af", "#fb7185", "#f43f5e"],
    },
  ];

  useEffect(() => {
    const savedSettings = {
      theme: localStorage.getItem("theme") || "default",
      notifications: JSON.parse(localStorage.getItem("notifications")) || false,
      compactView: JSON.parse(localStorage.getItem("compactView")) || false,
      timeFormat: localStorage.getItem("timeFormat") || "12h",
    };
    setSettings(savedSettings);

    const theme = themes.find((t) => t.id === savedSettings.theme);
    if (theme) {
      document.documentElement.style.setProperty(
        "--gradient-start",
        theme.colors[0]
      );
      document.documentElement.style.setProperty(
        "--gradient-middle",
        theme.colors[1]
      );
      document.documentElement.style.setProperty(
        "--gradient-end",
        theme.colors[2]
      );
    }

    if (savedSettings.compactView) {
      document.documentElement.classList.add("compact-view");
    }
  }, []);

  const handleThemeChange = (themeId) => {
    const theme = themes.find((t) => t.id === themeId);
    document.documentElement.style.setProperty(
      "--gradient-start",
      theme.colors[0]
    );
    document.documentElement.style.setProperty(
      "--gradient-middle",
      theme.colors[1]
    );
    document.documentElement.style.setProperty(
      "--gradient-end",
      theme.colors[2]
    );

    setSettings((prev) => ({ ...prev, theme: themeId }));
    localStorage.setItem("theme", themeId);
  };

  const handleSettingChange = (setting, value) => {
    setSettings((prev) => ({ ...prev, [setting]: value }));

    localStorage.setItem(
      setting,
      typeof value === "boolean" ? JSON.stringify(value) : value
    );

    switch (setting) {
      case "compactView":
        if (value) {
          document.documentElement.classList.add("compact-view");
        } else {
          document.documentElement.classList.remove("compact-view");
        }
        break;
      case "timeFormat":
        window.dispatchEvent(new Event("settingsChanged"));
        break;
      case "notifications":
        if (value) {
          Notification.requestPermission();
        }
        break;
    }
  };

  const handleProfileChange = (e) => {
    setProfile((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setError("");
    setSuccess("");
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (
      profile.newPassword &&
      profile.newPassword !== profile.confirmPassword
    ) {
      setError("New passwords do not match");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://127.0.0.1:5000/auth/update_profile",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            username: profile.username || undefined,
            email: profile.email || undefined,
            current_password: profile.currentPassword,
            new_password: profile.newPassword || undefined,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSuccess("Profile updated successfully");
        // Update stored username if it was changed
        if (profile.username) {
          localStorage.setItem("username", profile.username);
        }
        // Clear sensitive fields
        setProfile((prev) => ({
          ...prev,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        }));
      } else {
        setError(data.message || "Failed to update profile");
      }
    } catch (err) {
      setError("Network error occurred");
    }
  };

  useEffect(() => {
    if (settings.notifications && Notification.permission !== "granted") {
      Notification.requestPermission().then((permission) => {
        if (permission !== "granted") {
          setSettings((prev) => ({ ...prev, notifications: false }));
          localStorage.setItem("notifications", "false");
        }
      });
    }
  }, [settings.notifications]);

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h2>Settings</h2>
        <button className="back-button" onClick={() => navigate("/tasks")}>
          <i className="fas fa-arrow-left"></i>
          Back to Tasks
        </button>
      </div>

      <div className="settings-content">
        <section className="settings-section profile-section">
          <h3>Profile Settings</h3>
          <form onSubmit={handleProfileUpdate} className="profile-form">
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                name="username"
                value={profile.username}
                onChange={handleProfileChange}
                placeholder="Enter new username"
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={profile.email}
                onChange={handleProfileChange}
                placeholder="Enter new email"
              />
            </div>

            <div className="form-group">
              <label>Current Password</label>
              <input
                type="password"
                name="currentPassword"
                value={profile.currentPassword}
                onChange={handleProfileChange}
                placeholder="Enter current password"
                required
              />
            </div>

            <div className="form-group">
              <label>New Password (optional)</label>
              <input
                type="password"
                name="newPassword"
                value={profile.newPassword}
                onChange={handleProfileChange}
                placeholder="Enter new password"
              />
            </div>

            <div className="form-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={profile.confirmPassword}
                onChange={handleProfileChange}
                placeholder="Confirm new password"
                disabled={!profile.newPassword}
              />
            </div>

            <button type="submit" className="update-profile-btn">
              Update Profile
            </button>
          </form>
        </section>

        <div className="right-column">
          <section className="settings-section">
            <h3>User Preferences</h3>
            <div className="preferences-list">
              <div className="preference-item">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.notifications}
                    onChange={(e) =>
                      handleSettingChange("notifications", e.target.checked)
                    }
                  />
                  <span>Enable Notifications</span>
                </label>
              </div>

              <div className="preference-item">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.compactView}
                    onChange={(e) =>
                      handleSettingChange("compactView", e.target.checked)
                    }
                  />
                  <span>Compact View</span>
                </label>
              </div>

              <div className="preference-item">
                <label>Time Format</label>
                <select
                  value={settings.timeFormat}
                  onChange={(e) =>
                    handleSettingChange("timeFormat", e.target.value)
                  }
                >
                  <option value="12h">12-hour</option>
                  <option value="24h">24-hour</option>
                </select>
              </div>
            </div>
          </section>

          <section className="settings-section">
            <h3>Theme Customization</h3>
            <div className="theme-options">
              {themes.map((theme) => (
                <div
                  key={theme.id}
                  className={`theme-option ${
                    settings.theme === theme.id ? "active" : ""
                  }`}
                  onClick={() => handleThemeChange(theme.id)}
                >
                  <div
                    className="theme-preview"
                    style={{
                      background: `linear-gradient(45deg, ${theme.colors.join(
                        ", "
                      )})`,
                    }}
                  />
                  <span>{theme.name}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Settings;
