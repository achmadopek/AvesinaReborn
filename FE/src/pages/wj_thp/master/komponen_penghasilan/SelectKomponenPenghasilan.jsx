// SelectKomponenPenghasilan.js
import { useEffect, useState } from 'react';

const SelectKomponenPenghasilan = ({ label, id, name, value, onChange, fetchOptions }) => {
  const [options, setOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadOptions = async () => {
      setIsLoading(true);
      try {
        const data = await fetchOptions();
        setOptions(data);
      } catch (err) {
        console.error("Gagal memuat opsi komponen:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadOptions();
  }, [fetchOptions]);

  return (
    <div className="form-group">
      {label && <label htmlFor={id}>{label}</label>}
      <select
        id={id}
        name={name}
        value={value || ''}
        onChange={onChange}
        required
      >
        <option value="">Pilih Komponen</option>
        {options.map((item) => (
          <option key={item.id} value={item.id}>
            {item.penghasilan_code} - {item.penghasilan_nm}
          </option>
        ))}
      </select>
    </div>
  );
};

export default SelectKomponenPenghasilan;
