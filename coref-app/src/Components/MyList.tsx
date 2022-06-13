import * as React from 'react';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';


interface MyListProps {
    connectedCorefs?: Array<string>,
    handleSelectCoref: Function;
}

const MyList: React.FC<MyListProps> = ({ connectedCorefs, handleSelectCoref }) => {
  const [open, setOpen] = React.useState(true);

  const handleClick = () => {
    setOpen(!open);
  };

  // TODO: keep track of each mention id in the corresponding item and set it as selected coref when selected in list
  return (
    <List sx={{ marginTop: -1, width: '100%', maxWidth: 360,
        bgcolor: 'background.paper', height: 200, overflow: 'auto' }} component="nav">
        <ListItemButton disabled={true} onClick={handleClick}>
            <ListItemText primary="N/A" />
        </ListItemButton>
    </List>
  );
}

export default MyList;
