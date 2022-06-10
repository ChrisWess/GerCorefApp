import * as React from 'react';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';

export default function MyList() {
  const [open, setOpen] = React.useState(true);

  const handleClick = () => {
    setOpen(!open);
  };

  return (
    <List sx={{ marginTop: -1, width: '100%', maxWidth: 360,
        bgcolor: 'background.paper', height: 200, overflow: 'auto' }} component="nav">
        <ListItemButton disabled={true} onClick={handleClick}>
            <ListItemText primary="N/A" />
        </ListItemButton>
        <ListItemButton disabled={true} onClick={handleClick}>
            <ListItemText primary="N/A" />
        </ListItemButton>
        <ListItemButton disabled={true} onClick={handleClick}>
            <ListItemText primary="N/A" />
        </ListItemButton>
        <ListItemButton disabled={true} onClick={handleClick}>
            <ListItemText primary="N/A" />
        </ListItemButton>
        <ListItemButton disabled={true} onClick={handleClick}>
            <ListItemText primary="N/A" />
        </ListItemButton>
    </List>
  );
}