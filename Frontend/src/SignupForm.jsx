import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./SignForm.css";
import { Link } from "react-router-dom";


const SignupForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  });

  const [message, setMessage] = useState("");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setStatus(null);

    try {
      const response = await axios.post(
        "http://localhost:3000/signup",
        formData
      );

      setMessage(response.data.message);
      setStatus(response.data.status);

      if (response.data.status === 1) {
        setTimeout(() => navigate("/login"), 1000);
      }
    } catch (err) {
      setMessage(err.response?.data?.error || "Server error");
      setStatus(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <form className="signup-card" onSubmit={handleSubmit}>
        <h2>Create Account ✨</h2>

        {message && (
          <div className={`message ${status === 1 ? "success" : "error"}`}>
            {message}
          </div>
        )}

        <div className="form-group">
          <label>Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Signing up..." : "Signup"}
        </button>
        <p className="login-text" style={{textAlign:"center"}}>Already have an account?{" "}<Link to="/login" className="login-link">Login</Link></p>
      </form>
    </div>
  );
};

export default SignupForm;
