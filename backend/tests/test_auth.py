import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_login_success():
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "admin@enterprise.com", "password": "Password@123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["user"]["email"] == "admin@enterprise.com"

def test_login_invalid_password():
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "admin@enterprise.com", "password": "WrongPassword"}
    )
    assert response.status_code == 401

def test_token_refresh():
    login_resp = client.post(
        "/api/v1/auth/login",
        data={"username": "manager@enterprise.com", "password": "Password@123"}
    )
    refresh_token = login_resp.json()["refresh_token"]

    refresh_resp = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token}
    )
    assert refresh_resp.status_code == 200
    assert "access_token" in refresh_resp.json()

def test_me_endpoint():
    login_resp = client.post(
        "/api/v1/auth/login",
        data={"username": "maker@enterprise.com", "password": "Password@123"}
    )
    token = login_resp.json()["access_token"]

    me_resp = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == "maker@enterprise.com"
