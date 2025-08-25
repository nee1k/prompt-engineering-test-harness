from ..factories import make_prompt_system_payload


def test_list_test_runs_empty(client):
    resp = client.get("/test-runs/")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


def test_create_test_run_404_when_prompt_system_missing(client):
    payload = {
        "prompt_system_id": "missing",
        "regression_set": [{"text": "hello", "language": "es", "expected_output": "hola"}],
        "evaluation_function": "fuzzy",
    }
    resp = client.post("/test-runs/", json=payload)
    assert resp.status_code == 404

