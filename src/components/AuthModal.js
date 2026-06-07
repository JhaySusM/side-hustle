"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Modal,
  ModalHeader,
  ModalBody,
  Nav,
  NavItem,
  NavLink,
  TabContent,
  TabPane,
  Form,
  FormGroup,
  Label,
  Input,
  Button,
  Alert,
} from "reactstrap";

export default function AuthModal({ isOpen, toggle, onAuthSuccess, onLoginSuccess, onRegisterSuccess }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("login");
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [registerData, setRegisterData] = useState({ name: "", email: "", address: "", password: "", confirm: "" });
  const [error, setError] = useState("");

  // Seed default credential
  useEffect(() => {
    const users = JSON.parse(localStorage.getItem("batjee_users") || "[]");
    const seedEmail = "jhaysu@gmail.com";
    if (!users.find((u) => u.email === seedEmail)) {
      users.push({ name: "Jhaysu", email: seedEmail, password: "pass1234" });
      localStorage.setItem("batjee_users", JSON.stringify(users));
    }
  }, []);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    if (!loginData.email || !loginData.password) {
      setError("Please enter your email and password.");
      return;
    }
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginData.email, password: loginData.password })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed.");
        return;
      }
      onAuthSuccess(data.user);
      onLoginSuccess?.(data.user);
      toggle();
      if (!onLoginSuccess) {
        router.push("/dashboard");
      }
    } catch (err) {
      setError("Login failed. Please try again.");
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setError("");
    if (!registerData.name || !registerData.email || !registerData.address.trim() || !registerData.password || !registerData.confirm) {
      setError("Please fill in all fields.");
      return;
    }
    if (registerData.password !== registerData.confirm) {
      setError("Passwords do not match.");
      return;
    }
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: registerData.name,
          email: registerData.email,
          address: registerData.address.trim(),
          password: registerData.password
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed.");
        return;
      }
      onAuthSuccess(data.user);
      onRegisterSuccess?.(data.user);
      toggle();
      if (!onRegisterSuccess) {
        router.push("/dashboard");
      }
    } catch (err) {
      setError("Registration failed. Please try again.");
    }
  }

  function switchTab(tab) {
    setActiveTab(tab);
    setError("");
  }

  return (
    <Modal isOpen={isOpen} toggle={toggle} centered>
      <ModalHeader toggle={toggle}>
        {activeTab === "login" ? "Sign In to Batjee" : "Create an Account"}
      </ModalHeader>
      <ModalBody>
        <Nav tabs className="mb-3">
          <NavItem>
            <NavLink
              href="#"
              active={activeTab === "login"}
              onClick={() => switchTab("login")}
              style={{ cursor: "pointer", fontWeight: activeTab === "login" ? 600 : 400 }}
            >
              Login
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink
              href="#"
              active={activeTab === "register"}
              onClick={() => switchTab("register")}
              style={{ cursor: "pointer", fontWeight: activeTab === "register" ? 600 : 400 }}
            >
              Register
            </NavLink>
          </NavItem>
        </Nav>

        {error && <Alert color="danger">{error}</Alert>}

        <TabContent activeTab={activeTab}>
          <TabPane tabId="login">
            <Form onSubmit={handleLogin}>
              <FormGroup>
                <Label for="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="you@example.com"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  autoComplete="email"
                />
              </FormGroup>
              <FormGroup>
                <Label for="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  autoComplete="current-password"
                />
              </FormGroup>
              <Button color="primary" block type="submit">Sign In</Button>
              <p className="text-center mt-3 mb-0" style={{ fontSize: 14 }}>
                No account?{" "}
                <span
                  style={{ color: "#0d6efd", cursor: "pointer" }}
                  onClick={() => switchTab("register")}
                >
                  Register here
                </span>
              </p>
            </Form>
          </TabPane>

          <TabPane tabId="register">
            <Form onSubmit={handleRegister}>
              <FormGroup>
                <Label for="reg-name">Full Name</Label>
                <Input
                  id="reg-name"
                  type="text"
                  placeholder="Juan dela Cruz"
                  value={registerData.name}
                  onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                  autoComplete="name"
                />
              </FormGroup>
              <FormGroup>
                <Label for="reg-email">Email</Label>
                <Input
                  id="reg-email"
                  type="email"
                  placeholder="you@example.com"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                  autoComplete="email"
                />
              </FormGroup>
              <FormGroup>
                <Label for="reg-address">Address</Label>
                <Input
                  id="reg-address"
                  type="text"
                  placeholder="Street, city, barangay"
                  value={registerData.address}
                  onChange={(e) => setRegisterData({ ...registerData, address: e.target.value })}
                  autoComplete="street-address"
                  required
                />
              </FormGroup>
              <FormGroup>
                <Label for="reg-password">Password</Label>
                <Input
                  id="reg-password"
                  type="password"
                  placeholder="Min. 6 characters"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                  autoComplete="new-password"
                />
              </FormGroup>
              <FormGroup>
                <Label for="reg-confirm">Confirm Password</Label>
                <Input
                  id="reg-confirm"
                  type="password"
                  placeholder="Repeat password"
                  value={registerData.confirm}
                  onChange={(e) => setRegisterData({ ...registerData, confirm: e.target.value })}
                  autoComplete="new-password"
                />
              </FormGroup>
              <Button color="primary" block type="submit">Create Account</Button>
              <p className="text-center mt-3 mb-0" style={{ fontSize: 14 }}>
                Already have an account?{" "}
                <span
                  style={{ color: "#0d6efd", cursor: "pointer" }}
                  onClick={() => switchTab("login")}
                >
                  Sign in
                </span>
              </p>
            </Form>
          </TabPane>
        </TabContent>
      </ModalBody>
    </Modal>
  );
}
