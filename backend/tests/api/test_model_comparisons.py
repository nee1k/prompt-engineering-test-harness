def test_list_model_comparisons_empty(client):
    resp = client.get("/model-comparisons/")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)

