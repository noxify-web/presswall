import {
  afterEach,
  beforeEach,
  describe,
  expect,
  mock,
  spyOn,
  test,
} from "bun:test";

function setTestUrl(url: string) {
  (
    window as unknown as Window & {
      happyDOM: { setURL: (url: string) => void };
    }
  ).happyDOM.setURL(url);
}

describe("navigateAdminPath", () => {
  const assign = mock(() => undefined);
  let getSessionTokenSpy: ReturnType<typeof spyOn>;
  let redirectToSessionBounceSpy: ReturnType<typeof spyOn>;
  let originalAssign: typeof window.location.assign;

  beforeEach(async () => {
    assign.mockReset();
    setTestUrl("https://app.example.com/?shop=test.myshopify.com&host=abc");

    originalAssign = window.location.assign.bind(window.location);
    window.location.assign = assign as typeof window.location.assign;

    const adminFetch = await import("@/lib/admin-fetch");
    getSessionTokenSpy = spyOn(adminFetch, "getSessionToken");
    redirectToSessionBounceSpy = spyOn(
      adminFetch,
      "redirectToSessionBounce"
    ).mockImplementation(() => undefined);
  });

  afterEach(() => {
    window.location.assign = originalAssign;
    getSessionTokenSpy.mockRestore();
    redirectToSessionBounceSpy.mockRestore();
  });

  test("navigates with id_token when session token is available", async () => {
    getSessionTokenSpy.mockImplementation(() =>
      Promise.resolve("session-token")
    );
    const { navigateAdminPath } = await import("@/lib/admin-navigation");

    await navigateAdminPath("/editor");

    expect(assign).toHaveBeenCalledWith(
      "/editor?shop=test.myshopify.com&host=abc&id_token=session-token"
    );
    expect(redirectToSessionBounceSpy).not.toHaveBeenCalled();
  });

  test("uses session bounce with target path when token is unavailable", async () => {
    getSessionTokenSpy.mockImplementation(() => Promise.resolve(null));
    const { navigateAdminPath } = await import("@/lib/admin-navigation");

    await navigateAdminPath("/editor");

    expect(redirectToSessionBounceSpy).toHaveBeenCalledWith(
      "/editor?shop=test.myshopify.com&host=abc"
    );
    expect(assign).not.toHaveBeenCalled();
  });

  test("retries token lookup before falling back to session bounce", async () => {
    getSessionTokenSpy
      .mockImplementationOnce(() => Promise.resolve(null))
      .mockImplementationOnce(() => Promise.resolve(null))
      .mockImplementationOnce(() => Promise.resolve("late-token"));
    const { navigateAdminPath } = await import("@/lib/admin-navigation");

    await navigateAdminPath("/editor");

    expect(getSessionTokenSpy).toHaveBeenCalledTimes(3);
    expect(assign).toHaveBeenCalledWith(
      "/editor?shop=test.myshopify.com&host=abc&id_token=late-token"
    );
    expect(redirectToSessionBounceSpy).not.toHaveBeenCalled();
  });
});
