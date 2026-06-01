import { useAuthorization } from '../hooks/useAuthorization';

function CarteModule({ module }) {
    const { user } = useAuthorization();
    return (
        <a 
            href={module.route} 
            class={`carteModule ${module.roles.includes(user?.role) ? '' : 'carteModule-disabled'} carteModule-${module.name.toLowerCase().replace(/\s+/g, '-')}`}
        >
            <div class="carteModule-icon">
                <i class={module.icon} aria-hidden="true"></i>
            </div>
            <h3 class="carteModule-title">{module.name}</h3>
        </a>
    )
}

export default CarteModule;