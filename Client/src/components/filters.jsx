import { useContext } from 'react';
import { Form } from 'react-bootstrap';

const Filters = ({ filterConfig, context }) => {
  const contextValue = useContext(context);
  
  if (!contextValue) {
    console.error('Context is undefined. Ensure Filters is wrapped in the correct Context Provider.');
    return null;
  }

  const { filters, setFilters } = contextValue;

  if (!filters || !setFilters) {
    console.error('Filters or setFilters is undefined in context:', contextValue);
    return null;
  }

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // Options pour chaque type de filtre
  const filterOptions = {
    commercial: [
      { value: 'Tous', label: 'Tous' },
      { value: 'Commercial 1', label: 'Commercial 1' },
      { value: 'Commercial 2', label: 'Commercial 2' },
    ],
    status: {
      clients: [
        { value: 'Tous', label: 'Tous' },
        { value: 'Prospect', label: 'Prospect' },
        { value: 'Client', label: 'Client' },
      ],
      dossiers: [
        { value: 'Tous', label: 'Tous' },
        { value: 'Nouveau', label: 'Nouveau' },
        { value: 'En cours', label: 'En cours' },
        { value: 'Cloture', label: 'Clôturé' },
      ],
      factures: [
        { value: 'Tous', label: 'Tous' },
        { value: 'Non validée', label: 'Non validée' },
        { value: 'Non payée', label: 'Non payée' },
        { value: 'Payée', label: 'Payée' },
      ],
    },
    client: [
      { value: 'Tous', label: 'Tous' },
      { value: 'Cendrillon Ayot', label: 'Cendrillon Ayot' },
      { value: 'Client A', label: 'Client A' },
      { value: 'Client B', label: 'Client B' },
      { value: 'Client C', label: 'Client C' },
      { value: 'Client D', label: 'Client D' },
    ],
  };

  return (
    <div className="mb-4">
      <Form>
        <div className="d-flex gap-3">
          {filterConfig.map((filter) => (
            <Form.Group key={filter.name}>
              <Form.Label>{filter.label}</Form.Label>
              {filter.type === 'select' ? (
                <Form.Select
                  name={filter.name}
                  value={filters[filter.name] || 'Tous'}
                  onChange={handleFilterChange}
                  style={{ borderColor: 'orange' }}
                >
                  {(filter.name === 'status'
                    ? filterOptions.status[filter.statusType || 'clients']
                    : filterOptions[filter.name] || []
                  ).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Form.Select>
              ) : (
                <Form.Control
                  type={filter.type}
                  name={filter.name}
                  value={filters[filter.name] || ''}
                  onChange={handleFilterChange}
                  style={{ borderColor: filter.type !== 'text' ? 'orange' : undefined }}
                />
              )}
            </Form.Group>
          ))}
        </div>
      </Form>
    </div>
  );
};

export default Filters;