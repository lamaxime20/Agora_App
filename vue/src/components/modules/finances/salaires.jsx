import ListeSalaries from "./salaires/listeSalaries.jsx";
import "../../../assets/styles/components/modules/finances/salaires.css";

function Salaires() {
    return (
        <div className="finSal-root">
            <main>
                <ListeSalaries />
            </main>
        </div>
    );
}

export default Salaires;
