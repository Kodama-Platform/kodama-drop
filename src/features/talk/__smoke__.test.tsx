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

test("landing shows the address plaque and live-reveals a Drop form for a taken address", async () => {
  mount("/");
  await waitFor(() => expect(screen.getByTestId("address-plaque-input")).toBeInTheDocument());
  fireEvent.change(screen.getByTestId("address-plaque-input"), { target: { value: "alex" } });
  await waitFor(() => {
    expect(screen.getByTestId("availability-status")).toHaveAttribute("data-status", "taken");
    expect(screen.getByTestId("door-composer")).toBeInTheDocument();
  }, { timeout: 4000 });
});

test("claimed place shows visitor Door with origin options, consent + door note", async () => {
  mount("/alex");
  await waitFor(() => {
    expect(screen.getByTestId("door-view")).toBeInTheDocument();
    expect(screen.getByTestId("origin-anonymous")).toBeInTheDocument();
    expect(screen.getByTestId("origin-place")).toBeInTheDocument();
    expect(screen.getByTestId("door-send")).toBeInTheDocument();
    expect(screen.getByTestId("this-is-me")).toBeInTheDocument();
    expect(screen.getByTestId("door-consent")).toBeInTheDocument();
    expect(screen.getByTestId("door-note")).toBeInTheDocument();
  });
});

test("unclaimed address offers a claim flow", async () => {
  mount("/some-empty-place");
  await waitFor(() => expect(screen.getByTestId("claim-this-btn")).toBeInTheDocument());
  fireEvent.click(screen.getByTestId("claim-this-btn"));
  await waitFor(() => expect(screen.getByTestId("claim-view")).toBeInTheDocument());
});

test("claiming a place shows the recovery Key Card before entering the Shelf", async () => {
  mount("/fresh-place-abc");
  await waitFor(() => expect(screen.getByTestId("claim-this-btn")).toBeInTheDocument());
  fireEvent.click(screen.getByTestId("claim-this-btn"));
  await waitFor(() => screen.getByTestId("claim-view"));
  fireEvent.change(screen.getByTestId("claim-name"), { target: { value: "Sam" } });
  fireEvent.change(screen.getByTestId("claim-password"), { target: { value: "secret" } });
  fireEvent.change(screen.getByTestId("claim-confirm"), { target: { value: "secret" } });
  fireEvent.click(screen.getByTestId("claim-submit"));
  await waitFor(() => {
    expect(screen.getByTestId("key-card-sheet")).toBeInTheDocument();
    expect(screen.getByTestId("key-card-code").textContent?.length ?? 0).toBeGreaterThan(4);
  });
  expect(screen.getByTestId("key-card-continue")).toBeDisabled();
  fireEvent.click(screen.getByTestId("key-card-ack"));
  fireEvent.click(screen.getByTestId("key-card-continue"));
  await waitFor(() => expect(screen.getByTestId("shelf-rail")).toBeInTheDocument(), { timeout: 4000 });
});

test("owner can unlock a claimed place and reach the Shelf", async () => {
  mount("/alex");
  await waitFor(() => screen.getByTestId("this-is-me"));
  fireEvent.click(screen.getByTestId("this-is-me"));
  await waitFor(() => screen.getByTestId("unlock-view"));
  fireEvent.change(screen.getByTestId("unlock-password"), { target: { value: "secret" } });
  fireEvent.click(screen.getByTestId("unlock-submit"));
  await waitFor(
    () => {
      expect(screen.getByTestId("shelf-rail")).toBeInTheDocument();
      expect(screen.getByTestId("shelf-stream")).toBeInTheDocument();
      expect(screen.getByTestId("open-share")).toBeInTheDocument();
    },
    { timeout: 4000 },
  );
});
