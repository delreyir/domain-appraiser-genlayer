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
            web_data = gl.nondet.web.get(f"https://{domain}").body.decode("utf-8")
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
            response = gl.nondet.exec_prompt(prompt)
            return json.loads(response)

        def validator_fn(leader_result) -> bool:
            if not isinstance(leader_result, gl.vm.Return):
                return False
            validator_data = leader_fn()
            leader_data = leader_result.calldata
            # Grade must match, value within 40% tolerance
            if leader_data["grade"] != validator_data["grade"]:
                return False
            leader_val = leader_data["estimated_value_usd"]
            validator_val = validator_data["estimated_value_usd"]
            if leader_val == 0:
                return validator_val == 0
            return abs(leader_val - validator_val) / max(leader_val, 1) <= 0.4

        result = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)

        appraisal["status"] = 1
        appraisal["valuation"] = json.dumps(result)
        self.appraisals[appraisal_id] = json.dumps(appraisal)

    @gl.public.view
    def get_appraisal(self, appraisal_id: str) -> str:
        return self.appraisals[appraisal_id]

    @gl.public.view
    def get_appraisal_count(self) -> i32:
        return self.appraisal_count
