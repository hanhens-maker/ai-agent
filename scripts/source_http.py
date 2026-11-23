"""Small verified HTTP client shared by the compliance source collectors."""

from __future__ import annotations

import shutil
import ssl
import subprocess
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


USER_AGENT = "trawa-compliance-research/0.1 (+internal research)"


class SourceHttpError(RuntimeError):
    """Raised when a source cannot be retrieved safely."""


def fetch_url(
    url: str,
    timeout: float = 30.0,
    *,
    accept: str = "application/xml",
    method: str = "GET",
    headers: dict[str, str] | None = None,
    body: bytes | None = None,
) -> bytes:
    request_headers = {"Accept": accept, "User-Agent": USER_AGENT}
    request_headers.update(headers or {})
    request = Request(url, data=body, headers=request_headers, method=method)
    try:
        with urlopen(request, timeout=timeout) as response:
            return response.read()
    except HTTPError as error:
        response_body = error.read().decode("utf-8", errors="replace")
        raise SourceHttpError(
            f"request failed with HTTP {error.code}: {response_body[:500]}"
        ) from error
    except URLError as error:
        # macOS Python often has a separate CA bundle from the system trust
        # store. SecureTransport-backed curl can verify the official sources.
        if isinstance(error.reason, ssl.SSLCertVerificationError):
            return _fetch_with_system_curl(
                url,
                timeout,
                accept=accept,
                method=method,
                headers=headers or {},
                body=body,
            )
        raise SourceHttpError(f"request failed: {error.reason}") from error


def _fetch_with_system_curl(
    url: str,
    timeout: float,
    *,
    accept: str,
    method: str,
    headers: dict[str, str],
    body: bytes | None,
) -> bytes:
    curl = shutil.which("curl")
    if not curl:
        raise SourceHttpError(
            "TLS verification failed with Python and no system curl fallback is available"
        )

    command = [
        curl,
        "--fail-with-body",
        "--silent",
        "--show-error",
        "--max-time",
        str(timeout),
        "--request",
        method,
        "--header",
        f"Accept: {accept}",
        "--user-agent",
        USER_AGENT,
    ]
    for name, value in headers.items():
        command.extend(["--header", f"{name}: {value}"])
    if body is not None:
        command.extend(["--data-binary", "@-"])
    command.append(url)

    completed = subprocess.run(
        command,
        input=body,
        check=False,
        capture_output=True,
    )
    if completed.returncode != 0:
        details = completed.stderr.decode("utf-8", errors="replace").strip()
        response_body = completed.stdout.decode("utf-8", errors="replace").strip()
        raise SourceHttpError(
            f"request failed via system curl: {details or response_body[:500]}"
        )
    return completed.stdout
