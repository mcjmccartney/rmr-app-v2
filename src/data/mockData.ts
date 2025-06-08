import { Session, Client, MonthlyFinance } from '@/types';

export const mockSessions: Session[] = [
  {
    id: '1',
    clientId: '1',
    sessionType: 'In-Person',
    bookingDate: new Date('2025-07-30T09:30:00'),
    quote: 75,
    notes: 'Great progress with recall training'
  },
  {
    id: '2',
    clientId: '2',
    sessionType: 'In-Person',
    bookingDate: new Date('2025-07-25T12:00:00'),
    quote: 85,
  },
  {
    id: '3',
    clientId: '3',
    sessionType: 'In-Person',
    bookingDate: new Date('2025-07-25T09:15:00'),
    quote: 75,
  },
  {
    id: '4',
    clientId: '4',
    sessionType: 'In-Person',
    bookingDate: new Date('2025-07-23T10:00:00'),
    quote: 80,
  },
  {
    id: '5',
    clientId: '5',
    sessionType: 'Training',
    bookingDate: new Date('2025-07-18T09:00:00'),
    quote: 85,
  },
  {
    id: '6',
    clientId: '6',
    sessionType: 'In-Person',
    bookingDate: new Date('2025-07-11T09:30:00'),
    quote: 75,
  },
  {
    id: '7',
    clientId: '7',
    sessionType: 'In-Person',
    bookingDate: new Date('2025-07-10T09:30:00'),
    quote: 80,
  },
  {
    id: '8',
    clientId: '8',
    sessionType: 'Training',
    bookingDate: new Date('2025-07-08T09:30:00'),
    quote: 85,
  },
  {
    id: '9',
    clientId: '9',
    sessionType: 'Online',
    bookingDate: new Date('2025-07-07T16:30:00'),
    quote: 60,
  },
  {
    id: '10',
    clientId: '10',
    sessionType: 'Group',
    bookingDate: new Date('2025-07-04T19:00:00'),
    quote: 25,
  },
];

export const mockClients: Client[] = [
  {
    id: '1',
    firstName: 'Sarah',
    lastName: 'Cook',
    dogName: 'Larry',
    phone: '07123456789',
    email: 'sarah.cook@email.com',
    address: '123 Main Street, London, SW1A 1AA',
    active: true,
    membership: true
  },
  {
    id: '2',
    firstName: 'Test',
    lastName: 'User',
    dogName: 'Buddy',
    phone: '07987654321',
    email: 'test.user@email.com',
    active: true,
    membership: false,
    avatar: 'RMR'
  },
  {
    id: '3',
    firstName: 'Grace',
    lastName: 'Bryant',
    dogName: 'Ruby',
    phone: '07555123456',
    email: 'grace.bryant@email.com',
    address: '456 Oak Avenue, Manchester, M1 1AA',
    active: true,
    membership: true
  },
  {
    id: '4',
    firstName: 'Julie',
    lastName: 'Moore',
    dogName: 'Mila',
    phone: '07444987654',
    email: 'julie.moore@email.com',
    active: true,
    membership: false
  },
  {
    id: '5',
    firstName: 'Amelia',
    lastName: 'Wright',
    dogName: 'Milo',
    otherDogs: ['Bella', 'Max'],
    phone: '07333456789',
    email: 'amelia.wright@email.com',
    address: '789 Pine Road, Birmingham, B1 1AA',
    active: true,
    membership: true
  },
  {
    id: '6',
    firstName: 'Tara',
    lastName: 'Connolly',
    dogName: 'Charlie',
    phone: '07222123456',
    email: 'tara.connolly@email.com',
    active: true,
    membership: false,
    avatar: 'RMR'
  },
  {
    id: '7',
    firstName: 'Rose',
    lastName: 'Halpin',
    dogName: 'Bear',
    phone: '07111987654',
    email: 'rose.halpin@email.com',
    address: '321 Elm Street, Leeds, LS1 1AA',
    active: true,
    membership: true
  },
  {
    id: '8',
    firstName: 'Louise',
    lastName: 'Rowntree',
    dogName: 'Paddy',
    phone: '07000456789',
    email: 'louise.rowntree@email.com',
    active: true,
    membership: true,
    avatar: 'RMR'
  },
  {
    id: '9',
    firstName: 'Katy',
    lastName: 'Suckling',
    dogName: 'Remy',
    phone: '07999123456',
    email: 'katy.suckling@email.com',
    address: '654 Maple Drive, Bristol, BS1 1AA',
    active: true,
    membership: false,
    avatar: 'RMR'
  },
  {
    id: '10',
    firstName: 'Jay',
    lastName: 'Dobinsteen',
    dogName: 'Winnie',
    phone: '07888987654',
    email: 'jay.dobinsteen@email.com',
    active: true,
    membership: true
  },
];

export const mockFinances: MonthlyFinance[] = [
  { month: 'June', year: 2025, expected: 2600, actual: 2344, variance: -256 },
  { month: 'July', year: 2025, expected: 2000, actual: 785, variance: -1215 },
  { month: 'May', year: 2025, expected: 2800, actual: 2871, variance: 71 },
  { month: 'April', year: 2025, expected: 1730, actual: 1536, variance: 9 },
  { month: 'April', year: 2024, expected: 1730, actual: 203, variance: 9 },
  { month: 'March', year: 2024, expected: 1550, actual: 1777, variance: 227 },
  { month: 'February', year: 2024, expected: 1619, actual: 1643, variance: 24 },
  { month: 'January', year: 2024, expected: 1200, actual: 1421, variance: 221 },
  { month: 'December', year: 2023, expected: 900, actual: 985, variance: 85 },
  { month: 'November', year: 2023, expected: 900, actual: 960, variance: 60 },
  { month: 'October', year: 2023, expected: 757, actual: 757, variance: 0 },
];
