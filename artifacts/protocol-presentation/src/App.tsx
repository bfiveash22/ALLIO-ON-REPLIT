import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Presentation from "./pages/Presentation";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Switch>
          <Route path="/" component={Presentation} />
          <Route path="/present" component={Presentation} />
          <Route>
            <div className="h-screen w-screen flex items-center justify-center bg-gray-900">
              <p className="text-gray-400">Page not found</p>
            </div>
          </Route>
        </Switch>
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
