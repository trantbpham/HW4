import React, { useEffect ,useState } from 'react';
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


export default async function TownSelection({ doLogin }: TownSelectionProps): Promise<JSX.Element> {
  const [userName, setUserName] = useState<string>(Video.instance()?.userName || '');
  const [room, setRoom] = useState<string>(Video.instance()?.coveyTownID || '');
  const { connect } = useVideoContext();
  const { apiClient } = useCoveyAppState();
  const toast = useToast();
  const [rooms, setRoomList] = React.useState<CoveyTownInfo[]>([]);
  const retrieveList = async () => { 
    const response = await apiClient.listTowns(); 
    setRoomList(response.towns);
 };



  const testRoomRequest = {
    friendlyName: "test Room Request",
    isPubliclyListed: true,
  };



  useEffect(() => {  
    retrieveList();
    setTimeout(()=> { retrieveList() },2000) 
    return function cleanup() {

    }
  })
  
  const handleJoin = async () => {
    try {
      if (!userName || userName.length === 0) {
        toast({
          title: 'Unable to join town',
          description: 'Please select a username',
          status: 'error',
        });
        return;
      }
        const initData = await Video.setup(userName, room);
        console.log('initData', initData)
        console.log("retrieve name:", room);
        console.log("click!");

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
                     value={userName}
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
                <Button data-testid='joinTownByIDButton' onClick={handleJoin}>Connect</Button>
              </Flex>
            </Box>

            <Heading p="4" as="h4" size="md">Select a public town to join</Heading>
            <Box maxH="500px" overflowY="scroll">

              <Table>
                <TableCaption placement="bottom">Publicly Listed Towns</TableCaption>
                <Thead>
                  <Tr>
                    <Th>Room Name</Th>
                    <Th>Town ID</Th>
                    <Th>Current Occupancy</Th>
                    <Th>Maximum Occupancy</Th>
                    <Th>Activity</Th></Tr></Thead>
                <Tbody>
                        <Tr key='demoTownID'>
                <Td role='cell'>{ rooms.map(town => <td key = 'inner cell' >{town.friendlyName} </td> ) }</Td>
                <Td role='cell'>{ rooms.map(town => town.coveyTownID) }</Td>
                <Td role='cell'>{rooms.map(town => town.currentOccupancy)}</Td>
                <Td role='cell'>{rooms.map(town => town.maximumOccupancy)}</Td>
                <Td role='cell'>Unknown/Unknown 
                    <Button onClick={handleJoin}>Connect</Button></Td></Tr>
                </Tbody>
              </Table>
            </Box>
          </Box>
        </Stack>
      </form>
    </>
  );
}
