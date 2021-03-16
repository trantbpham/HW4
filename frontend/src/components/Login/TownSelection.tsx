import React, { useCallback, useEffect ,useState } from 'react';
import assert from "assert";
import {
  Box,
  Button,
  Checkbox,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Stack,
  Table,
  TableCaption,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  useToast
} from '@chakra-ui/react';
import useVideoContext from '../VideoCall/VideoFrontend/hooks/useVideoContext/useVideoContext';
import Video from '../../classes/Video/Video';
import { TownJoinResponse, CoveyTownInfo } from '../../classes/TownsServiceClient';
import useCoveyAppState from '../../hooks/useCoveyAppState';


interface TownSelectionProps {
  doLogin: (initData: TownJoinResponse) => Promise<boolean>
}


export default function TownSelection({ doLogin }: TownSelectionProps): JSX.Element {
  const [userNameJoin, setUserName] = useState<string>(Video.instance()?.userName || '');
  const [room, setRoom] = useState<string>(Video.instance()?.coveyTownID || '');
  const { connect } = useVideoContext();
  const { apiClient } = useCoveyAppState();
  const toast = useToast();
  const [rooms, setRoomList] = React.useState<CoveyTownInfo[]>([]);



  const retrieveList = useCallback(async () => { 
    const response = await apiClient.listTowns(); 
    setRoomList(response.towns);
 }, [apiClient,setRoomList],)

 retrieveList();
  useEffect(() => {  
    const id = setInterval(()=> { retrieveList() },2000) 
    return (() => {
      clearInterval(id)
    })
  })
  

  // const sortDescending = () => {

  // }
  const handleJoin = async () => {
    try {
      if (!userNameJoin || userNameJoin.length === 0) {
        toast({
          title: 'Unable to join town',
          description: 'Please select a username',
          status: 'error',
        });
        return;
      }

      const initData = await Video.setup(userNameJoin, room);

      const joinRoomRequest = {
        userName: userNameJoin,
        coveyTownID: room
      }
      // eslint-disable-next-line no-restricted-syntax
      for (const oneTown of rooms) {
        if ( oneTown.coveyTownID !== room || room.length === 0) {
          toast({
            title: 'Unable to connect to Towns Service',
            description: 'Please enter a town ID',
            status: 'error',
          })
        }
        console.log("line 1");
        apiClient.joinTown(joinRoomRequest);
        console.log("line 2");
          return;
      }
    

      const loggedIn = await doLogin(initData);
      if (loggedIn) {
        assert(initData.providerVideoToken);
        await connect(initData.providerVideoToken);
      }
    } catch (err) {
      toast({
        title: 'Unable to connect to Towns Service',
        description: err.toString(),
        status: 'error'
      })
    }
  };

  return (
    <>
      <form>
        <Stack>
          <Box p="4" borderWidth="1px" borderRadius="lg">
            <Heading as="h2" size="lg">Select a username</Heading>
            <FormControl>
              <FormLabel htmlFor="name">Name</FormLabel>
              <Input autoFocus name="name" placeholder="Your name"
                     value={userNameJoin}
                     onChange={event => setUserName(event.target.value)}
              />
            </FormControl>
          </Box>
          <Box borderWidth="1px" borderRadius="lg">
            <Heading p="4" as="h2" size="lg">Create a New Town</Heading>
            <Flex p="4">
              <Box flex="1">
                <FormControl>
                  <FormLabel htmlFor="townName">New Town Name</FormLabel>
                  <Input name="townName" placeholder="New Town Name"
                  />
                </FormControl>
              </Box><Box>
              <FormControl>
                <FormLabel htmlFor="isPublic">Publicly Listed</FormLabel>
                <Checkbox id="isPublic" name="isPublic"/>
              </FormControl>
            </Box>
              <Box>
                <Button data-testid="newTownButton">Create</Button>
              </Box>
            </Flex>
          </Box>
          <Heading p="4" as="h2" size="lg">-or-</Heading>

          <Box borderWidth="1px" borderRadius="lg">
            <Heading p="4" as="h2" size="lg">Join an Existing Town</Heading>
            <Box borderWidth="1px" borderRadius="lg">
              <Flex p="4"><FormControl>
              <FormLabel htmlFor="townIDToJoin">Town ID</FormLabel>
                <Input autoFocus name="townIDToJoin" placeholder="ID of town to join, or select from list"
                     value={room}
                     onChange={event => setRoom(event.target.value)}
                     />
              </FormControl>
                <Button data-testid='townIDToJoin' onClick={handleJoin}>Connect</Button>
              </Flex>
            </Box>

            <Heading p="4" as="h4" size="md">Select a public town to join</Heading>
            <Box maxH="500px" overflowY="scroll">
              <Table>
                <TableCaption placement="bottom">Publicly Listed Towns</TableCaption>
                <Thead>
                  <Tr>
                    <Th>Town Name</Th>
                    <Th>Town ID</Th>
                    <Th>Activity</Th>
                    </Tr></Thead>
                { rooms.map(town => 
                  <Tr key={`${town.coveyTownID}`}>               
                    <Td role='cell'>{town.friendlyName}</Td>
                    <Td role='cell'>{town.coveyTownID }</Td>
                    <Td role='cell'>{town.currentOccupancy}/{town.maximumOccupancy} <Button onClick={handleJoin}>Connect</Button></Td>
                  </Tr> 
                  )
                  }
              </Table>
            </Box>
          </Box>
        </Stack>
      </form>
    </>
  );
}
