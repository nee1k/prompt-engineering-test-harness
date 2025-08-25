from ..factories import make_prompt_system_payload


def test_list_prompt_systems_empty(client):
    resp = client.get("/prompt-systems/")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


def test_create_and_get_prompt_system(client):
    payload = make_prompt_system_payload()
    create = client.post("/prompt-systems/", json=payload)
    assert create.status_code == 200
    ps = create.json()
    assert ps["name"] == payload["name"]

    get_one = client.get(f"/prompt-systems/{ps['id']}")
    assert get_one.status_code == 200
    assert get_one.json()["id"] == ps["id"]


def test_get_prompt_system_404(client):
    resp = client.get("/prompt-systems/does-not-exist")
    assert resp.status_code == 404

