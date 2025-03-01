import { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import TaskList from "./TaskList";
import TaskForm from "./TaskForm";
import Login from "./components/Login";
import Register from "./components/Register";
import Settings from "./components/Settings";
import "./App.css";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(
    localStorage.getItem("selectedDay") || "monday"
  );

  const checkAuthStatus = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setIsAuthenticated(false);
      setUser(null);
      return;
    }

    try {
      const tokenData = JSON.parse(atob(token.split(".")[1]));
      if (tokenData.exp * 1000 < Date.now()) {
        handleLogout();
      } else {
        setIsAuthenticated(true);
        setUser({ username: localStorage.getItem("username") });
        fetchTasks(); // Fetch tasks when auth is confirmed
      }
    } catch (error) {
      handleLogout();
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkTokenExpiration = () => {
    const token = localStorage.getItem("token");
    if (!token) return false;

    try {
      const tokenData = JSON.parse(atob(token.split(".")[1]));
      const expirationTime = tokenData.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();

      // If token is expired or about to expire in the next hour
      if (expirationTime - currentTime < 3600000) {
        handleLogout();
        return false;
      }
      return true;
    } catch (error) {
      handleLogout();
      return false;
    }
  };

  const fetchTasks = async (day = selectedDay) => {
    try {
      if (!checkTokenExpiration()) {
        navigate("/login");
        return;
      }

      setIsLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`http://127.0.0.1:5000/tasks/${day}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        handleLogout();
        navigate("/login");
        return;
      }

      const data = await response.json();
      if (response.ok) {
        setTasks(data.tasks);
      } else {
        console.error("Failed to fetch tasks:", data.message);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (userData) => {
    setIsAuthenticated(true);
    setUser(userData);
    fetchTasks(); // Fetch tasks after successful login
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    setIsAuthenticated(false);
    setUser(null);
    setTasks([]);
  };

  const openCreateModal = () => {
    if (!isModalOpen) {
      setCurrentTask({});
      setIsModalOpen(true);
    }
  };

  const openUpdateModal = (task) => {
    if (!isModalOpen) {
      setCurrentTask(task);
      setIsModalOpen(true);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentTask({});
  };

  const onTaskUpdate = () => {
    closeModal();
    fetchTasks();
  };

  const handleDayChange = (day) => {
    setSelectedDay(day);
    localStorage.setItem("selectedDay", day);
    fetchTasks(day);
  };

  const days = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];

  const TaskManagementApp = () => {
    const location = useLocation();
    const navigate = useNavigate();

    return (
      <div className="app-layout">
        <aside className="sidebar">
          <div className="sidebar-brand">Tame.io</div>
          {user && (
            <div className="sidebar-welcome">Welcome, {user.username}!</div>
          )}
          <nav>
            <ul className="nav-menu">
              <li className="nav-item-group">
                <div className="nav-item-header">
                  <i className="fas fa-tasks"></i>
                  Task List
                </div>
                <ul className="nav-submenu">
                  {days.map((day) => (
                    <li
                      key={day}
                      className={`nav-subitem ${
                        selectedDay === day ? "active" : ""
                      }`}
                      onClick={() => handleDayChange(day)}
                    >
                      {day.charAt(0).toUpperCase() + day.slice(1)}
                    </li>
                  ))}
                </ul>
              </li>
              <li
                className={`nav-item ${
                  location.pathname === "/settings" ? "active" : ""
                }`}
                onClick={() => navigate("/settings")}
              >
                <i className="fas fa-cog"></i>
                Settings
              </li>
            </ul>
          </nav>
          <div className="sidebar-footer">
            <button onClick={handleLogout} className="logout-button">
              <i className="fas fa-sign-out-alt"></i>
              Logout
            </button>
          </div>
        </aside>

        <main className="main-content">
          {location.pathname === "/tasks" ? (
            <TaskList
              tasks={tasks}
              updateTask={openUpdateModal}
              updateCallBack={fetchTasks}
              openCreateModal={openCreateModal}
              isModalOpen={isModalOpen}
              closeModal={closeModal}
              currentTask={currentTask}
              onTaskUpdate={onTaskUpdate}
              selectedDay={selectedDay}
            />
          ) : location.pathname === "/settings" ? (
            <Settings />
          ) : null}
        </main>
      </div>
    );
  };

  useEffect(() => {
    const tokenCheckInterval = setInterval(() => {
      if (isAuthenticated && !checkTokenExpiration()) {
        navigate("/login");
      }
    }, 60000); // Check every minute

    return () => clearInterval(tokenCheckInterval);
  }, [isAuthenticated]);

  return (
    <BrowserRouter>
      <div className="app-container">
        <Routes>
          <Route
            path="/login"
            element={
              !isAuthenticated ? (
                <Login onLogin={handleLogin} />
              ) : (
                <Navigate to="/tasks" />
              )
            }
          />
          <Route
            path="/register"
            element={!isAuthenticated ? <Register /> : <Navigate to="/tasks" />}
          />
          <Route
            path="/tasks"
            element={
              isAuthenticated ? <TaskManagementApp /> : <Navigate to="/login" />
            }
          />
          <Route
            path="/settings"
            element={isAuthenticated ? <Settings /> : <Navigate to="/login" />}
          />
          <Route
            path="/"
            element={
              isAuthenticated ? (
                <Navigate to="/tasks" />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
