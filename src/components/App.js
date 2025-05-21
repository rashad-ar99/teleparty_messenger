import { useState } from "react";
import { Provider } from "../contexts/Provider.tsx";
import { Dashboard } from "./Dashboard.tsx";

const App = () => {
    const [isOptionSelected, setIsOptionSelected] = useState(false);
    return (
        <Provider setIsOptionSelected={setIsOptionSelected}>
            <Dashboard
                isOptionSelected={isOptionSelected}
                setIsOptionSelected={setIsOptionSelected}
            />
        </Provider>
    );
};

export default App;
