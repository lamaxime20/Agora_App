import { Link } from 'react-router-dom';
import {
    ChevronRight,
    Settings,
    ShoppingBag,
    Users,
    Wallet,
    Warehouse,
} from 'lucide-react';
import '../assets/styles/components/carteModule.css';

const ICONS = {
    Settings,
    ShoppingBag,
    Users,
    Wallet,
    Warehouse,
};

function CarteModule({ module, index = 0 }) {
    const Icon = ICONS[module.icon] ?? Warehouse;

    return (
        <Link
            to={module.route}
            className="carteModule-root"
            style={{
                '--module-color': module.color,
                '--module-color-rgb': module.colorRgb,
                '--card-index': index,
            }}
            aria-label={`Accéder au module ${module.name}`}
        >
            <div className="carteModule-icon">
                <Icon size={22} aria-hidden="true" />
            </div>
            <div className="carteModule-body">
                <span className="carteModule-name">{module.name}</span>
                <span className="carteModule-desc">{module.description}</span>
            </div>
            <ChevronRight size={16} className="carteModule-arrow" aria-hidden="true" />
        </Link>
    );
}

export default CarteModule;
