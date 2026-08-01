"use client";
import { useState } from "react";
import {
  Modal, ModalHeader, ModalBody, Form, FormGroup, Label, Input, Button, Alert, Spinner,
} from "reactstrap";
import { PAKISTAN_CITIES, getPostalCodeForCity } from "@/lib/pakistan-cities";

export default function AddAddressModal({ isOpen, onSaved, onCancel }) {
  const [form, setForm] = useState({
    addressHouseNo: "",
    addressStreetNo: "",
    addressArea: "",
    addressCity: "",
    addressPostalCode: "",
    addressCountry: "PAKISTAN",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleCityChange(e) {
    const city = e.target.value;
    setForm((current) => ({
      ...current,
      addressCity: city,
      addressPostalCode: getPostalCodeForCity(city),
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (
      !form.addressHouseNo.trim() ||
      !form.addressStreetNo.trim() ||
      !form.addressArea.trim() ||
      !form.addressCity.trim() ||
      !form.addressPostalCode.trim() ||
      !form.addressCountry.trim()
    ) {
      setError("Please fill in all fields.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save address.");
        return;
      }
      onSaved(data.user);
    } catch (err) {
      setError("Failed to save address. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal isOpen={isOpen} centered backdrop="static" keyboard={false}>
      <ModalHeader>Add your address</ModalHeader>
      <ModalBody>
        <p className="text-muted" style={{ fontSize: 14 }}>
          We need your address before you can post an ad — buyers use it to find listings near them.
        </p>
        {error && <Alert color="danger">{error}</Alert>}
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label for="addr-country">Country</Label>
            <Input id="addr-country" type="text" value={form.addressCountry} disabled readOnly />
          </FormGroup>
          <FormGroup>
            <Label for="addr-city">City Name</Label>
            <Input id="addr-city" type="select" value={form.addressCity} onChange={handleCityChange} required>
              <option value="">Select a city</option>
              {PAKISTAN_CITIES.map((city) => (
                <option key={city.name} value={city.name}>{city.name}</option>
              ))}
            </Input>
          </FormGroup>
          <FormGroup>
            <Label for="addr-postal">Postal Code</Label>
            <Input
              id="addr-postal"
              type="text"
              placeholder="Auto-filled from selected city"
              value={form.addressPostalCode}
              disabled
              readOnly
              required
            />
          </FormGroup>
          <FormGroup>
            <Label for="addr-house">House No.</Label>
            <Input
              id="addr-house"
              type="text"
              placeholder="e.g. 12-B"
              value={form.addressHouseNo}
              onChange={(e) => setForm({ ...form, addressHouseNo: e.target.value })}
              autoComplete="street-address"
              required
            />
          </FormGroup>
          <FormGroup>
            <Label for="addr-street">Street No.</Label>
            <Input
              id="addr-street"
              type="text"
              placeholder="e.g. 7"
              value={form.addressStreetNo}
              onChange={(e) => setForm({ ...form, addressStreetNo: e.target.value })}
              required
            />
          </FormGroup>
          <FormGroup>
            <Label for="addr-area">Sector / Area / Sub-locality</Label>
            <Input
              id="addr-area"
              type="text"
              placeholder="e.g. DHA Phase 5"
              value={form.addressArea}
              onChange={(e) => setForm({ ...form, addressArea: e.target.value })}
              required
            />
          </FormGroup>
          <Button color="primary" block type="submit" disabled={submitting}>
            {submitting ? (
              <>
                <Spinner size="sm" className="me-2" /> Saving...
              </>
            ) : (
              "Save address"
            )}
          </Button>
          <Button color="light" className="border mt-2" block type="button" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
        </Form>
      </ModalBody>
    </Modal>
  );
}
