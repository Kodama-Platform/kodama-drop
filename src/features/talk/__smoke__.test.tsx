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
  if (!Element.prototype.scrollIntoView) Element.prototype.scrollIntoView = () => {};
});

test("landing Door renders the claim CTA + address plaque", async () => {
  mount("/");
  await waitFor(() => {
    expect(screen.getByTestId("claim-address-btn")).toBeInTheDocument();
    expect(screen.getByTestId("address-plaque-input")).toBeInTheDocument();
  });
});

test("claimed place shows visitor Door with origin options + send", async () => {
  mount("/alex");
  await waitFor(() => {
    expect(screen.getByTestId("door-view")).toBeInTheDocument();
    expect(screen.getByTestId("origin-anonymous")).toBeInTheDocument();
    expect(screen.getByTestId("origin-place")).toBeInTheDocument();
    expect(screen.getByTestId("door-send")).toBeInTheDocument();
    expect(screen.getByTestId("this-is-me")).toBeInTheDocument();
  });
});

test("unclaimed address offers a claim flow", async () => {
  mount("/some-empty-place");
  await waitFor(() => expect(screen.getByTestId("claim-this-btn")).toBeInTheDocument());
  fireEvent.click(screen.getByTestId("claim-this-btn"));
  await waitFor(() => expect(screen.getByTestId("claim-view")).toBeInTheDocument());
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
      expect(screen.getByTestId("nav-drops")).toBeInTheDocument();
    },
    { timeout: 4000 },
  );
});
