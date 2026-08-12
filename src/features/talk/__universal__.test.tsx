import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { RouterProvider, createRouter, createMemoryHistory } from "@tanstack/react-router";
import { routeTree } from "@/routeTree.gen";

function mount(path: string) {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
  });
  render(<RouterProvider router={router as never} />);
  return router;
}

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  if (!Element.prototype.scrollIntoView) Element.prototype.scrollIntoView = () => {};
});

test("typing a taken address live-reveals the Drop form in place, without changing the URL", async () => {
  const router = mount("/");
  await waitFor(() => screen.getByTestId("address-plaque-input"));
  fireEvent.change(screen.getByTestId("address-plaque-input"), { target: { value: "alex" } });
  await waitFor(() => {
    expect(screen.getByTestId("availability-status")).toHaveAttribute("data-status", "taken");
    expect(screen.getByTestId("landing-reveal")).toBeInTheDocument();
    expect(screen.getByTestId("door-composer")).toBeInTheDocument();
  }, { timeout: 4000 });
  // URL must stay at root — no navigation happened.
  expect(router.state.location.pathname).toBe("/");
});

test("typing an available address live-reveals the Claim form, without changing the URL", async () => {
  const router = mount("/");
  await waitFor(() => screen.getByTestId("address-plaque-input"));
  fireEvent.change(screen.getByTestId("address-plaque-input"), { target: { value: "totally-free-xyz" } });
  await waitFor(() => {
    expect(screen.getByTestId("availability-status")).toHaveAttribute("data-status", "available");
    expect(screen.getByTestId("claim-view")).toBeInTheDocument();
    expect(screen.getByTestId("claim-password")).toBeInTheDocument();
  }, { timeout: 4000 });
  expect(router.state.location.pathname).toBe("/");
});

test("direct link opens the Door immediately at its own URL", async () => {
  const router = mount("/alex");
  await waitFor(() => expect(screen.getByTestId("door-view")).toBeInTheDocument());
  expect(router.state.location.pathname).toBe("/alex");
});

test("owner unlock happens in a sheet and reaches the Shelf", async () => {
  mount("/alex");
  await waitFor(() => screen.getByTestId("this-is-me"));
  fireEvent.click(screen.getByTestId("this-is-me"));
  await waitFor(() => screen.getByTestId("unlock-view"));
  fireEvent.change(screen.getByTestId("unlock-password"), { target: { value: "secret" } });
  fireEvent.click(screen.getByTestId("unlock-submit"));
  await waitFor(() => expect(screen.getByTestId("shelf-rail")).toBeInTheDocument(), { timeout: 4000 });
});

test("a reserved address cannot be claimed", async () => {
  mount("/");
  await waitFor(() => screen.getByTestId("address-plaque-input"));
  fireEvent.change(screen.getByTestId("address-plaque-input"), { target: { value: "admin" } });
  await waitFor(() => {
    expect(screen.getByTestId("availability-status")).toHaveAttribute("data-status", "reserved");
    expect(screen.getByTestId("reserved-state")).toBeInTheDocument();
  }, { timeout: 4000 });
});

test("a full pasted URL normalizes to the place name and resolves", async () => {
  const router = mount("/");
  await waitFor(() => screen.getByTestId("address-plaque-input"));
  fireEvent.change(screen.getByTestId("address-plaque-input"), { target: { value: "https://talk.kodama.page/alex" } });
  await waitFor(() => {
    expect(screen.getByTestId("availability-status")).toHaveAttribute("data-status", "taken");
    expect(screen.getByTestId("door-composer")).toBeInTheDocument();
  }, { timeout: 4000 });
  expect(router.state.location.pathname).toBe("/");
});

test("an address owned on this device shows 'Open my Talk'", async () => {
  // A remembered owner credential for the seeded place 'alex'
  window.localStorage.setItem(
    "kodama-talk/v1/owner-cred:alex",
    JSON.stringify({ address: "alex", displayName: "Alex Rivera" }),
  );
  const router = mount("/");
  await waitFor(() => screen.getByTestId("address-plaque-input"));
  fireEvent.change(screen.getByTestId("address-plaque-input"), { target: { value: "alex" } });
  await waitFor(() => {
    expect(screen.getByTestId("availability-status")).toHaveAttribute("data-status", "yours");
    expect(screen.getByTestId("open-my-talk")).toBeInTheDocument();
  }, { timeout: 4000 });
  expect(router.state.location.pathname).toBe("/");
});
