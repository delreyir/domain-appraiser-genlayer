# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *
import json
import typing
from datetime import datetime, timezone


class DomainAppraiser(gl.Contract):
    appraisal_count: i32
    appraisals: TreeMap[str, str]

    def __init__(self):
        self.appraisal_count = i32(0)

    @gl.public.write.payable
    def request_appraisal(self, domain: str) -> i32:
        value = gl.message.value
        if value == u256(0):
            raise gl.vm.UserError("Must pay appraisal fee")

        self.appraisal_count = i32(int(self.appraisal_count) + 1)
        appraisal_id = str(int(self.appraisal_count))
        now = int(datetime.now(timezone.utc).timestamp())

        appraisal = {
            "id": appraisal_id,
            "requester": str(gl.message.sender_address),
            "domain": domain,
            "fee": str(value),
            "status": 0,
            "valuation": "",
            "created_at": now,
        }
        self.appraisals[appraisal_id] = json.dumps(appraisal)
        return self.appraisal_count

    @gl.public.write
    def appraise(self, appraisal_id: str) -> typing.Any:
        appraisal = json.loads(self.appraisals[appraisal_id])
        if appraisal["status"] != 0:
            raise gl.vm.UserError("Already appraised")

        domain = appraisal["domain"]

        def leader_fn():
            try:
                web_data = gl.nondet.web.get(f"https://{domain}").body.decode("utf-8", "ignore")
            except Exception:
                web_data = ""
            prompt = f"""You are a domain name appraiser. Evaluate the market value of this domain.

DOMAIN: {domain}

WEBSITE CONTENT (first 2000 chars):
{web_data[:2000]}

Analyze based on:
1. Domain length and memorability
2. Keyword value and search demand
3. Extension (.com, .io, .xyz, etc.)
4. Current usage (active site, parked, unused)
5. Industry relevance and branding potential
6. Comparable domain sales

Return JSON:
{{
    "estimated_value_usd": number (low end),
    "estimated_value_high_usd": number (high end),
    "grade": "A" or "B" or "C" or "D" or "F",
    "strengths": ["..."],
    "weaknesses": ["..."],
    "comparable_sales": "brief mention of similar domains",
    "summary": "brief valuation explanation"
}}"""
            raw = gl.nondet.exec_prompt(prompt, response_format="json")
            if not isinstance(raw, dict):
                raw = {}
            grade = str(raw.get("grade", "C")).strip().upper()[:1]
            if grade not in ("A", "B", "C", "D", "F"):
                grade = "C"
            try:
                low_val = max(0, int(raw.get("estimated_value_usd", 0)))
            except (TypeError, ValueError):
                low_val = 0
            try:
                high_val = max(0, int(raw.get("estimated_value_high_usd", 0)))
            except (TypeError, ValueError):
                high_val = 0
            return {
                "estimated_value_usd": low_val,
                "estimated_value_high_usd": high_val,
                "grade": grade,
                "strengths": raw.get("strengths", []),
                "weaknesses": raw.get("weaknesses", []),
                "comparable_sales": str(raw.get("comparable_sales", "")),
                "summary": str(raw.get("summary", ""))[:1000],
            }

        def validator_fn(leader_result) -> bool:
            # Robust consensus: agree on the normalized letter grade only.
            if not isinstance(leader_result, gl.vm.Return):
                return False
            raw = gl.nondet.exec_prompt(prompt, response_format="json")
            if not isinstance(raw, dict):
                raw = {}
            grade = str(raw.get("grade", "C")).strip().upper()[:1]
            if grade not in ("A", "B", "C", "D", "F"):
                grade = "C"
            try:
                leader_grade = str(leader_result.calldata["grade"]).strip().upper()[:1]
            except (TypeError, KeyError):
                return False
            return grade == leader_grade

        result = gl.vm.run_nondet(leader_fn, validator_fn)

        appraisal["status"] = 1
        appraisal["valuation"] = json.dumps(result)
        self.appraisals[appraisal_id] = json.dumps(appraisal)

    @gl.public.view
    def get_appraisal(self, appraisal_id: str) -> str:
        return self.appraisals[appraisal_id]

    @gl.public.view
    def get_appraisal_count(self) -> i32:
        return self.appraisal_count
