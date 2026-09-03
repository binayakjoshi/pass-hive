import pytest


async def test_register_user(client):
    response = await client.post(
        "/users",
        json={"email": "alice@example.com", "master_password": "supersecret123"},
    )
    assert response.status_code == 201
    body = response.json()
    assert body["email"] == "alice@example.com"
    assert "hashed_master_password" not in body  # UserRead must never leak this
    assert "master_password" not in body


async def test_register_duplicate_email_fails(client):
    payload = {"email": "bob@example.com", "master_password": "supersecret123"}
    first = await client.post("/users", json=payload)
    assert first.status_code == 201

    second = await client.post("/users", json=payload)
    assert second.status_code == 409
    body = second.json()
    assert body["success"] is False
    assert body["code"] == "USER_ALREADY_EXISTS"


async def test_login_success_sets_cookie(client):
    await client.post(
        "/users",
        json={"email": "carol@example.com", "master_password": "supersecret123"},
    )

    response = await client.post(
        "/auth/login",
        json={"email": "carol@example.com", "master_password": "supersecret123"},
    )
    assert response.status_code == 200
    assert "access_token" in response.cookies


async def test_login_wrong_password_fails(client):
    await client.post(
        "/users",
        json={"email": "dave@example.com", "master_password": "supersecret123"},
    )

    response = await client.post(
        "/auth/login",
        json={"email": "dave@example.com", "master_password": "wrongpassword"},
    )
    assert response.status_code == 401
    body = response.json()
    assert body["code"] == "INVALID_CREDENTIALS"


async def test_login_nonexistent_email_fails(client):
    response = await client.post(
        "/auth/login",
        json={"email": "nobody@example.com", "master_password": "whatever123"},
    )
    assert response.status_code == 401
    assert response.json()["code"] == "INVALID_CREDENTIALS"


async def test_get_me_requires_auth(client):
    response = await client.get("/users/me")
    assert response.status_code == 401


async def test_get_me_with_valid_cookie(client):
    await client.post(
        "/users",
        json={"email": "erin@example.com", "master_password": "supersecret123"},
    )
    await client.post(
        "/auth/login",
        json={"email": "erin@example.com", "master_password": "supersecret123"},
    )

    response = await client.get("/users/me")
    assert response.status_code == 200
    assert response.json()["email"] == "erin@example.com"


async def test_update_me(client):
    await client.post(
        "/users",
        json={"email": "frank@example.com", "master_password": "supersecret123"},
    )
    await client.post(
        "/auth/login",
        json={"email": "frank@example.com", "master_password": "supersecret123"},
    )

    response = await client.patch("/users/me", json={"email": "frank2@example.com"})
    assert response.status_code == 200
    assert response.json()["email"] == "frank2@example.com"


async def test_delete_me_is_soft_delete(client):
    await client.post(
        "/users",
        json={"email": "grace@example.com", "master_password": "supersecret123"},
    )
    await client.post(
        "/auth/login",
        json={"email": "grace@example.com", "master_password": "supersecret123"},
    )

    delete_response = await client.delete("/users/me")
    assert delete_response.status_code == 204

    # same (now-stale) cookie should no longer work
    me_response = await client.get("/users/me")
    assert me_response.status_code == 401

    # login should also be blocked for a soft-deleted user
    login_response = await client.post(
        "/auth/login",
        json={"email": "grace@example.com", "master_password": "supersecret123"},
    )
    assert login_response.status_code == 401


async def test_register_after_soft_delete_shows_reactivate_message(client):
    payload = {"email": "henry@example.com", "master_password": "supersecret123"}
    await client.post("/users", json=payload)
    await client.post("/auth/login", json=payload)
    await client.delete("/users/me")

    response = await client.post("/users", json=payload)
    assert response.status_code == 409
    assert response.json()["code"] == "USER_DEACTIVATED"
