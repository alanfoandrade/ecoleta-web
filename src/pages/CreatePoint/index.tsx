import React, {
  useEffect,
  useState,
  useCallback,
  ChangeEvent,
  FormEvent,
} from 'react';
import { Link, useHistory } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { Map, TileLayer, Marker } from 'react-leaflet';
import { LeafletMouseEvent } from 'leaflet';

import axios from 'axios';
import Dropzone from '../../components/Dropzone';
import api from '../../services/api';

import './styles.css';

import logoImg from '../../assets/logo.svg';

interface IItem {
  id: string;
  title: string;
  image_url: string;
}

interface IIBGEStateResponse {
  sigla: string;
}

interface IIBGECityResponse {
  nome: string;
}

const CreatePoint: React.FC = () => {
  const history = useHistory();

  const [itemsData, setItemsData] = useState<IItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [selectedState, setSelectedState] = useState('0');
  const [selectedCity, setSelectedCity] = useState('0');
  const [initialPosition, setInitialPosition] = useState<[number, number]>([
    0,
    0,
  ]);
  const [selectedPosition, setSelectedPosition] = useState<[number, number]>(
    initialPosition,
  );
  const [selectedFile, setSelectedFile] = useState<File>();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    navigator.geolocation.getCurrentPosition((position) => {
      const { latitude, longitude } = position.coords;

      setInitialPosition([latitude, longitude]);
      setSelectedPosition([latitude, longitude]);
    });
  }, []);

  useEffect(() => {
    async function loadItemsData() {
      const response = await api.get('items');

      setItemsData(response.data);
    }

    loadItemsData();
  }, []);

  useEffect(() => {
    async function loadStates() {
      const response = await axios.get<IIBGEStateResponse[]>(
        'https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome',
      );

      const stateInitials = response.data.map((state) => state.sigla);

      setStates(stateInitials);
    }

    loadStates();
  }, []);

  useEffect(() => {
    async function loadCities() {
      const response = await axios.get<IIBGECityResponse[]>(
        `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedState}/municipios?orderBy=nome`,
      );

      const citiesNames = response.data.map((city) => city.nome);

      setCities(citiesNames);
    }

    if (selectedState !== '0') {
      loadCities();
    }
  }, [selectedState]);

  const handleSelectState = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      setSelectedState(event.target.value);
    },
    [],
  );

  const handleSelectCity = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      setSelectedCity(event.target.value);
    },
    [],
  );

  const handleMapClick = useCallback((event: LeafletMouseEvent) => {
    setSelectedPosition([event.latlng.lat, event.latlng.lng]);
  }, []);

  const handleInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const { name, value } = event.target;

      setFormData((prevState) => ({ ...prevState, [name]: value }));
    },
    [],
  );

  const handleSelectItem = useCallback(
    (itemId: string) => {
      const itemSelected = selectedItems.findIndex((item) => item === itemId);

      if (itemSelected >= 0) {
        setSelectedItems(selectedItems.filter((item) => item !== itemId));
      } else {
        setSelectedItems([...selectedItems, itemId]);
      }
    },
    [selectedItems],
  );

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      try {
        event.preventDefault();

        const { name, email, phone } = formData;
        const uf = selectedState;
        const city = selectedCity;
        const [latitude, longitude] = selectedPosition;
        const items = selectedItems;

        const data = new FormData();

        data.append('name', name);
        data.append('email', email);
        data.append('phone', phone);
        data.append('uf', uf);
        data.append('city', city);
        data.append('latitude', String(latitude));
        data.append('longitude', String(longitude));
        data.append('items', items.join(','));

        if (selectedFile) {
          data.append('image', selectedFile);
        }

        await api.post('points', data);

        alert('Ponto de coleta cadastrado');

        history.push('/');
      } catch (err) {
        alert('Erro ao cadastrar ponto de coleta');
      }
    },
    [
      formData,
      history,
      selectedCity,
      selectedFile,
      selectedItems,
      selectedPosition,
      selectedState,
    ],
  );

  return (
    <div id="page-create-point">
      <header>
        <img src={logoImg} alt="Ecoleta" />
        <Link to="/">
          <FiArrowLeft />
          Voltar para home
        </Link>
      </header>

      <form onSubmit={handleSubmit}>
        <h1>
          Cadastro do
          <br />
          ponto de coleta
        </h1>

        <Dropzone onFileUploaded={setSelectedFile} />

        <fieldset>
          <legend>
            <h2>Dados</h2>
          </legend>

          <div className="field">
            <label htmlFor="name">Nome da entidade</label>
            <input
              type="text"
              name="name"
              id="name"
              onChange={handleInputChange}
            />
          </div>

          <div className="field-group">
            <div className="field">
              <label htmlFor="email">E-mail</label>
              <input
                type="email"
                name="email"
                id="email"
                onChange={handleInputChange}
              />
            </div>
            <div className="field">
              <label htmlFor="phone">Whatsapp</label>
              <input
                type="text"
                name="phone"
                id="phone"
                onChange={handleInputChange}
              />
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>
            <h2>Endereço</h2>
            <span>Selecione o endereço no mapa</span>
          </legend>

          <Map center={initialPosition} zoom={15} onClick={handleMapClick}>
            <TileLayer
              attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={selectedPosition} />
          </Map>

          <div className="field-group">
            <div className="field">
              <label htmlFor="uf">Estado (UF)</label>
              <select
                name="uf"
                id="uf"
                value={selectedState}
                onChange={handleSelectState}
              >
                <option value="0">Selecione uma UF</option>
                {states.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="cidade">Cidade</label>
              <select
                name="cidade"
                id="cidade"
                value={selectedCity}
                onChange={handleSelectCity}
              >
                <option value="0">Selecione uma cidade</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>
            <h2>Ítems de coleta</h2>
            <span>Selecione um ou mais ítens abaixo</span>
          </legend>

          <ul className="items-grid">
            {itemsData.map((item) => (
              <li
                key={item.id}
                role="menuitem"
                onClick={() => handleSelectItem(item.id)}
                onKeyPress={() => handleSelectItem(item.id)}
                className={selectedItems.includes(item.id) ? 'selected' : ''}
              >
                <img src={item.image_url} alt={item.title} />
                <span>{item.title}</span>
              </li>
            ))}
          </ul>
        </fieldset>

        <button type="submit">Cadastrar ponto de coleta</button>
      </form>
    </div>
  );
};

export default CreatePoint;
