import { useState } from "react";
import classes from './SearchBar.module.css';
import Input from "../UI/input/Input";

const SERVER_URL = process.env.REACT_APP_SERVER_URL || "http://localhost:3000";

const SearchBar = ({ currentUser, onProfileClick }) => {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);

  const handleSearch = async (e) => {
    const value = e.target.value;
    setSearch(value);
    if (!value.trim() || value.trim().length < 4) return setResults([]);
    const res = await fetch(`${SERVER_URL}/users?search=${value}`);
    const data = await res.json();
    setResults(data.filter(u => u.username !== currentUser));
  };

  return (
    <div className={classes.wrapper}>
      <Input
        autoComplete="off"
        className={classes.input}
        placeholder="Поиск..."
        value={search}
        onChange={handleSearch}
      />
      {results.length > 0 && (
        <div className={classes.results}>
          {results.map(u => (
            <div
              key={u.username}
              className={classes.item}
              onClick={() => { onProfileClick(u.username); setSearch(""); setResults([]); }}
            >
              <img
                className={classes.avatar}
                src={u.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${u.username}`}
                alt={u.username}
              />
              {u.username}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar;