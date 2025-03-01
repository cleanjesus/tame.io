import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Auth.css";

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch("http://127.0.0.1:5000/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("username", data.username);
        onLogin(data);
        navigate("/tasks");
      } else {
        setError(data.message || "Invalid credentials");
      }
    } catch (err) {
      setError("Network error occurred. Please try again.");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-image">
          <h2>Welcome to Tame.io</h2>
          <p>
            Organize your time, boost your productivity, and achieve more with
            our intuitive task management system.
          </p>
        </div>

        <div className="auth-form-container">
          <div className="auth-header">
            <h1>Sign in</h1>
            <p>Please enter your details to continue</p>
          </div>

          {error && (
            <div className="auth-message error">
              <i className="fas fa-exclamation-circle"></i>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <div className="input-wrapper">
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-wrapper">
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button type="submit" className="auth-submit">
              Sign In
            </button>
          </form>

          <div className="auth-footer">
            <p>Don't have an account?</p>
            <button onClick={() => navigate("/register")}>
              Create an account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
