"use client";
import { useState, useEffect, useRef } from "react";
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
  Spinner,
  FormFeedback,
} from "reactstrap";
import { PAKISTAN_CITIES, getPostalCodeForCity } from "@/lib/pakistan-cities";

export default function AuthModal({ isOpen, toggle, onAuthSuccess, onLoginSuccess, onRegisterSuccess }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("login");
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    addressHouseNo: "",
    addressStreetNo: "",
    addressArea: "",
    addressCity: "",
    addressPostalCode: "",
    addressCountry: "PAKISTAN",
    referralCode: "",
    password: "",
    confirm: "",
  });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [referralFromQuery, setReferralFromQuery] = useState("");
  const referralLocked = Boolean(referralFromQuery);

  const emailRef = useRef(null);
  const referralRef = useRef(null);
  const confirmRef = useRef(null);

  const [submitting, setSubmitting] = useState(false);

  const [verifyContext, setVerifyContext] = useState(null); // { email, origin, user } | null
  const [otpCode, setOtpCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setVerifyContext(null);
      setOtpCode("");
      setResendCooldown(0);
      setSubmitting(false);
      setFieldErrors({});
    }
  }, [isOpen]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((current) => Math.max(0, current - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  function completeAuth(user, origin) {
    window.dispatchEvent(new CustomEvent("batjee:login", { detail: { user } }));
    onAuthSuccess(user);
    if (origin === "register") {
      onRegisterSuccess?.(user);
    } else {
      onLoginSuccess?.(user);
    }
    toggle();
    if (origin === "register" ? !onRegisterSuccess : !onLoginSuccess) {
      router.push("/dashboard");
    }
  }

  // Seed default credential
  useEffect(() => {
    const users = JSON.parse(localStorage.getItem("batjee_users") || "[]");
    const seedEmail = "jhaysu@gmail.com";
    if (!users.find((u) => u.email === seedEmail)) {
      users.push({ name: "Jhaysu", email: seedEmail, password: "pass1234" });
      localStorage.setItem("batjee_users", JSON.stringify(users));
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const referralParam = String(params.get("ref") || "")
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 24);

    setReferralFromQuery(referralParam);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !referralFromQuery) {
      return;
    }

    setActiveTab("register");
    setRegisterData((current) => {
      if (current.referralCode === referralFromQuery) {
        return current;
      }

      return {
        ...current,
        referralCode: referralFromQuery,
      };
    });
  }, [isOpen, referralFromQuery]);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    if (!loginData.email || !loginData.password) {
      setError("Please enter your email and password.");
      return;
    }
    setSubmitting(true);
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
      if (data.requiresVerification) {
        setVerifyContext({ email: data.user.email, origin: "login" });
        return;
      }
      completeAuth(data.user, "login");
    } catch (err) {
      setError("Login failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    if (
      !registerData.name ||
      !registerData.email ||
      !registerData.addressHouseNo.trim() ||
      !registerData.addressStreetNo.trim() ||
      !registerData.addressArea.trim() ||
      !registerData.addressCity.trim() ||
      !registerData.addressPostalCode.trim() ||
      !registerData.addressCountry.trim() ||
      !registerData.password ||
      !registerData.confirm
    ) {
      setError("Please fill in all fields.");
      return;
    }
    if (registerData.password !== registerData.confirm) {
      setFieldErrors({ confirm: "Passwords do not match." });
      confirmRef.current?.focus();
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: registerData.name,
          email: registerData.email,
          addressHouseNo: registerData.addressHouseNo.trim(),
          addressStreetNo: registerData.addressStreetNo.trim(),
          addressArea: registerData.addressArea.trim(),
          addressCity: registerData.addressCity.trim(),
          addressPostalCode: registerData.addressPostalCode.trim(),
          addressCountry: registerData.addressCountry.trim(),
          referralCode: registerData.referralCode.trim(),
          password: registerData.password
        })
      });
      const data = await res.json();
      if (!res.ok) {
        const message = data.error || "Registration failed.";
        if (/email/i.test(message)) {
          setFieldErrors({ email: message });
          emailRef.current?.focus();
        } else if (/referral/i.test(message)) {
          setFieldErrors({ referralCode: message });
          referralRef.current?.focus();
        } else {
          setError(message);
        }
        return;
      }
      if (data.requiresVerification) {
        setVerifyContext({ email: data.user.email, origin: "register" });
        return;
      }
      completeAuth(data.user, "register");
    } catch (err) {
      setError("Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    setError("");
    if (!otpCode.trim()) {
      setError("Please enter the verification code.");
      return;
    }
    setVerifying(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: otpCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Verification failed.");
        return;
      }
      completeAuth(data.user, verifyContext?.origin);
    } catch (err) {
      setError("Verification failed. Please try again.");
    } finally {
      setVerifying(false);
    }
  }

  async function handleResendOtp() {
    setError("");
    setResending(true);
    try {
      const res = await fetch("/api/auth/resend-otp", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to resend code.");
        return;
      }
      setResendCooldown(60);
    } catch (err) {
      setError("Failed to resend code. Please try again.");
    } finally {
      setResending(false);
    }
  }

  function handleCityChange(e) {
    const city = e.target.value;
    setRegisterData((current) => ({
      ...current,
      addressCity: city,
      addressPostalCode: getPostalCodeForCity(city),
    }));
  }

  function switchTab(tab) {
    setActiveTab(tab);
    setError("");
    setFieldErrors({});
  }

  if (verifyContext) {
    return (
      <Modal isOpen={isOpen} toggle={toggle} centered>
        <ModalHeader toggle={toggle}>Verify your email</ModalHeader>
        <ModalBody>
          {error && <Alert color="danger">{error}</Alert>}
          <p style={{ fontSize: 14 }}>
            We sent a 6-digit code to <strong>{verifyContext.email}</strong>. Enter it below to
            continue.
          </p>
          <Form onSubmit={handleVerifyOtp}>
            <FormGroup>
              <Label for="otp-code">Verification Code</Label>
              <Input
                id="otp-code"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="123456"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                autoComplete="one-time-code"
                autoFocus
              />
            </FormGroup>
            <Button color="primary" block type="submit" disabled={verifying}>
              {verifying ? (
                <>
                  <Spinner size="sm" className="me-2" /> Verifying...
                </>
              ) : (
                "Verify"
              )}
            </Button>
            <p className="text-center mt-3 mb-0" style={{ fontSize: 14 }}>
              Didn&apos;t get a code?{" "}
              <span
                style={{
                  color: resendCooldown > 0 || resending ? "#94a3b8" : "#0d6efd",
                  cursor: resendCooldown > 0 || resending ? "default" : "pointer",
                }}
                onClick={() => {
                  if (resendCooldown > 0 || resending) return;
                  handleResendOtp();
                }}
              >
                {resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : "Resend code"}
              </span>
            </p>
          </Form>
        </ModalBody>
      </Modal>
    );
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
              <Button color="primary" block type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Spinner size="sm" className="me-2" /> Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
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
                  onChange={(e) => {
                    setRegisterData({ ...registerData, email: e.target.value });
                    setFieldErrors((current) => ({ ...current, email: undefined }));
                  }}
                  autoComplete="email"
                  innerRef={emailRef}
                  invalid={Boolean(fieldErrors.email)}
                />
                {fieldErrors.email && <FormFeedback>{fieldErrors.email}</FormFeedback>}
              </FormGroup>
              <FormGroup>
                <Label for="reg-referral">Referral Code <span className="text-muted">(Optional)</span></Label>
                <Input
                  id="reg-referral"
                  type="text"
                  placeholder="Enter referral code"
                  value={registerData.referralCode}
                  disabled={referralLocked}
                  onChange={(e) => {
                    setRegisterData({
                      ...registerData,
                      referralCode: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 24),
                    });
                    setFieldErrors((current) => ({ ...current, referralCode: undefined }));
                  }}
                  autoComplete="off"
                  innerRef={referralRef}
                  invalid={Boolean(fieldErrors.referralCode)}
                />
                {fieldErrors.referralCode && <FormFeedback>{fieldErrors.referralCode}</FormFeedback>}
                <small className="text-muted d-block mt-2">
                  {referralLocked
                    ? "This referral code came from your invite link and cannot be changed here."
                    : "If someone shared a TradiGO referral with you, paste the code here before creating your account."}
                </small>
              </FormGroup>
              <FormGroup>
                <Label for="reg-country">Country</Label>
                <Input id="reg-country" type="text" value={registerData.addressCountry} disabled readOnly />
              </FormGroup>
              <FormGroup>
                <Label for="reg-city">City Name</Label>
                <Input
                  id="reg-city"
                  type="select"
                  value={registerData.addressCity}
                  onChange={handleCityChange}
                  required
                >
                  <option value="">Select a city</option>
                  {PAKISTAN_CITIES.map((city) => (
                    <option key={city.name} value={city.name}>
                      {city.name}
                    </option>
                  ))}
                </Input>
              </FormGroup>
              <FormGroup>
                <Label for="reg-postal">Postal Code</Label>
                <Input
                  id="reg-postal"
                  type="text"
                  placeholder="Auto-filled from selected city"
                  value={registerData.addressPostalCode}
                  disabled
                  readOnly
                  required
                />
              </FormGroup>
              <FormGroup>
                <Label for="reg-house">House No.</Label>
                <Input
                  id="reg-house"
                  type="text"
                  placeholder="e.g. 12-B"
                  value={registerData.addressHouseNo}
                  onChange={(e) => setRegisterData({ ...registerData, addressHouseNo: e.target.value })}
                  autoComplete="street-address"
                  required
                />
              </FormGroup>
              <FormGroup>
                <Label for="reg-street">Street No.</Label>
                <Input
                  id="reg-street"
                  type="text"
                  placeholder="e.g. 7"
                  value={registerData.addressStreetNo}
                  onChange={(e) => setRegisterData({ ...registerData, addressStreetNo: e.target.value })}
                  required
                />
              </FormGroup>
              <FormGroup>
                <Label for="reg-area">Sector / Area / Sub-locality</Label>
                <Input
                  id="reg-area"
                  type="text"
                  placeholder="e.g. DHA Phase 5"
                  value={registerData.addressArea}
                  onChange={(e) => setRegisterData({ ...registerData, addressArea: e.target.value })}
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
                  onChange={(e) => {
                    setRegisterData({ ...registerData, confirm: e.target.value });
                    setFieldErrors((current) => ({ ...current, confirm: undefined }));
                  }}
                  autoComplete="new-password"
                  innerRef={confirmRef}
                  invalid={Boolean(fieldErrors.confirm)}
                />
                {fieldErrors.confirm && <FormFeedback>{fieldErrors.confirm}</FormFeedback>}
              </FormGroup>
              <Button color="primary" block type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Spinner size="sm" className="me-2" /> Creating account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
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
