import { PublicKey } from '@solana/web3.js'
import { Program, Wallet } from '@coral-xyz/anchor'
import { Firethree } from '../types/firethree'
import { Project } from '../types/project'
import { ShdwDrive } from '@shadow-drive/sdk'
import { v4 as uuidv4 } from 'uuid'
import axios from 'axios'
import { GENESYSGO_URL } from '../constants/storage'
import GENESYS_API from '../utils/api'

export default class Analytics {
  program: Program<Firethree>
  wallet: Wallet
  project: Project
  shdwDrive: ShdwDrive

  constructor(
    program: Program<Firethree>,
    wallet: Wallet,
    shdwDrive: ShdwDrive,
    project: Project
  ) {
    this.program = program
    this.wallet = wallet
    this.project = project
    this.shdwDrive = shdwDrive
  }

  private async getUserDataByIp() {
    const response = await axios.get('http://ip-api.com/json')

    if (!response.data || response.data.status !== 'success') {
      return
    }

    return {
      lat: response.data.lat as number,
      lng: response.data.lon as number,
      country: response.data.country as string,
      countryCode: response.data.countryCode as string,
      zip: response.data.zip as string,
      region: response.data.region as string
    }
  }

  /**
   * Setup Analytics
   * Track default events
   */
  public async setup() {
    if (!window) {
      return
    }

    this.trackEvent('page_view', {
      ts: Date.now(),
      pathname: window.location.pathname
    })

    const userDataByIp = await this.getUserDataByIp()

    const localStorage = window.localStorage
    const locationTracked = localStorage.getItem('locationTracked')

    if (
      localStorage.getItem('userId') &&
      locationTracked &&
      Number(locationTracked) < Date.now() - 1 * 60 * 60 * 1000
    ) {
      this.trackEvent('user_view', {})

      this.trackEvent('user_location', { ...userDataByIp })
      localStorage.setItem('locationTracked', Date.now().toString())
    }

    if (!localStorage.getItem('userId')) {
      const id = uuidv4()

      localStorage.setItem('userId', id)
      this.trackEvent('user_view', {})
      this.trackEvent('first_view', {
        ts: Date.now(),
        id
      })

      this.trackEvent('user_location', { ...userDataByIp })
      localStorage.setItem('locationTracked', Date.now().toString())
    }
  }

  /**
   * Get Number of Users
   */
  public async getNumberOfUsers() {
    const response = await GENESYS_API.get(
      `/${this.project.shdw}/analytics.list-user_view.json`
    )

    if (response.status === 404) {
      return {
        daily: 0,
        weekly: 0,
        monthly: 0
      }
    }

    const daily = response.data.filter(
      (event: { ts: number }) =>
        event.ts > Date.now() - 24 * 60 * 60 * 1000 && event.ts < Date.now()
    ).length

    const weekly = response.data.filter(
      (event: { ts: number }) =>
        event.ts > Date.now() - 7 * 24 * 60 * 60 * 1000 && event.ts < Date.now()
    ).length

    const monthly = response.data.filter(
      (event: { ts: number }) =>
        event.ts > Date.now() - 30 * 24 * 60 * 60 * 1000 &&
        event.ts < Date.now()
    ).length

    return {
      daily: Number(daily || 0),
      weekly: Number(weekly || 0),
      monthly: Number(monthly || 0)
    }
  }

  /**
   * Get Statistics
   */
  public async getStatistics() {
    const viewsResponse = await GENESYS_API.get(
      `/${this.project.shdw}/analytics.list-page_view.json`
    )

    const usersResponse = await GENESYS_API.get(
      `/${this.project.shdw}/analytics.list-user_view.json`
    )

    return {
      users: Number(usersResponse?.data?.length || 0),
      views: Number(viewsResponse?.data?.length || 0)
    }
  }

  /**
   * Get Main Events List (e.g. page_view, user_view)
   */
  public async getMainEventsList() {
    const listObjects = await this.shdwDrive.listObjects(
      new PublicKey(this.project.shdw)
    )

    const events = listObjects.keys.filter((item) =>
      item.includes('analytics.list-')
    )

    const response = await Promise.all(
      events.map(async (event) => {
        const eventSplit = event.split('.')

        if (eventSplit.length > 3) {
          return null
        }

        const eventResponse = await GENESYS_API.get(
          `/${this.project.shdw}/${event}`
        )

        return {
          name: eventSplit[1].split('-')[1],
          data: eventResponse.data
        }
      })
    )

    return response.filter((item) => item !== null)
  }

  /**
   * Get Events by Name
   * @param name Name of the event
   */
  public async getEventsByName(name: string) {
    const response = await GENESYS_API.get(
      `/${this.project.shdw}/analytics.list-${name}.json`
    )

    return response.data
  }

  /**
   * Track Event
   * @param event Name of the event
   * @param params Parameters of the event (e.g. { id: 1 })
   */
  public async trackEvent(name: string, params: { [key: string]: any }) {
    let listData: { ts: number; id: string }[] = []

    try {
      const response = await GENESYS_API.get(
        `/${this.project.shdw}/analytics.list-${name}.json`
      )

      listData = response.data
    } catch (error) {
      if (error.response.status === 404) {
        const eventListFile = new File(
          [JSON.stringify([])],
          `analytics.list-${name}.json`,
          {
            type: 'application/json'
          }
        )

        this.shdwDrive.uploadFile(
          new PublicKey(this.project.shdw),
          eventListFile
        )
      }
    }

    const id = uuidv4()
    const ts = Date.now()
    const eventFile = new File(
      [JSON.stringify({ ...params, id, ts: params.ts || ts })],
      `analytics.list-${name}.${id}.json`,
      {
        type: 'application/json'
      }
    )

    await this.shdwDrive.uploadFile(new PublicKey(this.project.shdw), eventFile)

    const newEventListFile = new File(
      [JSON.stringify([...listData, { id, ts: params.ts || ts }])],
      `analytics.list-${name}.json`,
      {
        type: 'application/json'
      }
    )

    await this.shdwDrive.editFile(
      new PublicKey(this.project.shdw),
      `${GENESYSGO_URL}/${this.project.shdw}/analytics.list-${name}.json`,
      newEventListFile
    )
  }
}
